const { Router }  = require("express");
const { authenticate } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const mammoth  = require("mammoth");
const jpegJs   = require("jpeg-js");
const zlib     = require("zlib");

// ── Avatar image extraction ───────────────────────────────────────────────────

// Score a raw RGBA pixel buffer by luminance variance (0 = solid colour, high = photo).
function photoVariance(rgbaData) {
  const SAMPLES = 400;
  const step = Math.max(1, Math.floor(rgbaData.length / 4 / SAMPLES)) * 4;
  let sum = 0, count = 0;
  for (let i = 0; i < rgbaData.length; i += step) {
    sum += 0.299 * rgbaData[i] + 0.587 * rgbaData[i + 1] + 0.114 * rgbaData[i + 2];
    count++;
  }
  if (!count) return 0;
  const mean = sum / count;
  let v = 0;
  for (let i = 0; i < rgbaData.length; i += step) {
    const lum = 0.299 * rgbaData[i] + 0.587 * rgbaData[i + 1] + 0.114 * rgbaData[i + 2];
    v += (lum - mean) ** 2;
  }
  return v / count;
}

// Convert raw pixels (RGB/Gray/CMYK) to RGBA Buffer.
function toRGBA(pixels, channels) {
  const n = pixels.length / channels;
  const out = Buffer.alloc(n * 4);
  for (let i = 0, j = 0; i < pixels.length; i += channels, j += 4) {
    if (channels === 3) {
      out[j] = pixels[i]; out[j + 1] = pixels[i + 1]; out[j + 2] = pixels[i + 2]; out[j + 3] = 255;
    } else if (channels === 1) {
      out[j] = out[j + 1] = out[j + 2] = pixels[i]; out[j + 3] = 255;
    } else if (channels === 4) {
      // CMYK → RGB
      const c = pixels[i] / 255, m = pixels[i + 1] / 255, y = pixels[i + 2] / 255, k = pixels[i + 3] / 255;
      out[j]     = Math.round(255 * (1 - c) * (1 - k));
      out[j + 1] = Math.round(255 * (1 - m) * (1 - k));
      out[j + 2] = Math.round(255 * (1 - y) * (1 - k));
      out[j + 3] = 255;
    }
  }
  return out;
}

// Undo PNG row-filter prediction (PDF /Predictor 10-15) applied to FlateDecode streams.
function undoPNGPredictor(data, width, channels) {
  const rowBytes = width * channels;
  const stride   = rowBytes + 1; // 1 filter byte per row
  const rows     = Math.floor(data.length / stride);
  const out      = Buffer.alloc(rows * rowBytes);
  for (let row = 0; row < rows; row++) {
    const filter  = data[row * stride];
    const inBase  = row * stride + 1;
    const outBase = row * rowBytes;
    const prevBase = (row - 1) * rowBytes;
    for (let i = 0; i < rowBytes; i++) {
      const raw = data[inBase + i];
      const a   = i >= channels ? out[outBase + i - channels] : 0;
      const b   = row > 0 ? out[prevBase + i] : 0;
      const c   = (row > 0 && i >= channels) ? out[prevBase + i - channels] : 0;
      let val;
      switch (filter) {
        case 0: val = raw; break;
        case 1: val = (raw + a) & 0xFF; break;
        case 2: val = (raw + b) & 0xFF; break;
        case 3: val = (raw + Math.floor((a + b) / 2)) & 0xFF; break;
        case 4: {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          val = (raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xFF;
          break;
        }
        default: return null;
      }
      out[outBase + i] = val;
    }
  }
  return out;
}

// Extract images from a PDF using two strategies:
//  1. DCTDecode (raw JPEG) — valid JPEG must start FF D8 FF
//  2. FlateDecode — decompress zlib stream and reconstruct pixel data
// Picks the image with the highest luminance variance (most photo-like).
// Returns { data: Buffer, mime: "image/jpeg" } or null.
function extractProfileImageFromPDF(buffer) {
  const pixelCandidates = []; // { rgba: Buffer, width, height, label }

  // ── Strategy 1: DCTDecode / raw JPEG streams ──────────────────────────────
  // Require FF D8 FF (3rd byte must be FF) to filter out coincidental matches
  // in compressed binary data (which caused 39 false positives before).
  {
    let off = 0;
    const EOI = Buffer.from([0xFF, 0xD9]);
    while (off < buffer.length - 3) {
      if (buffer[off] === 0xFF && buffer[off + 1] === 0xD8 && buffer[off + 2] === 0xFF) {
        const end = buffer.indexOf(EOI, off + 2);
        if (end !== -1 && end - off > 3000) {
          const blob = buffer.slice(off, end + 2);
          try {
            const dec = jpegJs.decode(blob, { maxResolutionInMP: 25, colorTransform: false });
            // Detect CMYK via SOF component count
            let isCmyk = false;
            let si = 2;
            while (si + 3 < blob.length) {
              if (blob[si] !== 0xFF) { si++; continue; }
              const mk = blob[si + 1];
              if (mk === 0xD9 || mk === 0xDA) break;
              if (mk === 0xD8 || (mk >= 0xD0 && mk <= 0xD7) || mk === 0x01) { si += 2; continue; }
              if (si + 3 >= blob.length) break;
              const sl = (blob[si + 2] << 8) | blob[si + 3];
              if (sl < 2) break;
              if ((mk >= 0xC0 && mk <= 0xCF) && mk !== 0xC4 && mk !== 0xC8 && mk !== 0xCC) {
                if (si + 9 < blob.length) isCmyk = blob[si + 9] === 4;
                break;
              }
              si += 2 + sl;
            }
            const rgba = isCmyk ? toRGBA(dec.data, 4) : dec.data;
            pixelCandidates.push({ rgba, width: dec.width, height: dec.height, label: `DCT ${blob.length}B` });
          } catch { /* not a valid JPEG */ }
          off = end + 2;
          continue;
        }
      }
      off++;
    }
    console.log(`[Avatar] DCTDecode pass: ${pixelCandidates.length} valid JPEG(s)`);
  }

  // ── Strategy 2: FlateDecode image streams ────────────────────────────────
  // Parse PDF stream dictionaries, find image XObjects with FlateDecode filter,
  // decompress with zlib, handle PNG predictor if present.
  {
    const str = buffer.toString("binary"); // latin1 preserves byte values
    let pos = 0;
    let flateFound = 0;
    while (pos < str.length) {
      // Every stream is preceded by its dictionary ending with >>
      const sIdx = str.indexOf("stream", pos);
      if (sIdx < 0) break;
      // 'stream' must be preceded by \n or \r (i.e. it's a keyword, not part of text)
      const pre = str[sIdx - 1];
      if (pre !== "\n" && pre !== "\r") { pos = sIdx + 6; continue; }

      // Find the dictionary immediately before this 'stream'
      let dEnd = sIdx - 1;
      while (dEnd > 0 && (str[dEnd] === "\r" || str[dEnd] === "\n" || str[dEnd] === " ")) dEnd--;
      if (str[dEnd] !== ">" || str[dEnd - 1] !== ">") { pos = sIdx + 6; continue; }
      const dStart = str.lastIndexOf("<<", dEnd);
      if (dStart < 0 || dEnd - dStart > 3000) { pos = sIdx + 6; continue; }
      const dict = str.slice(dStart, dEnd + 1);

      // Must be an Image XObject with a FlateDecode filter
      if (!(/\/Subtype\s*\/Image/.test(dict))) { pos = sIdx + 6; continue; }
      if (!(/\/FlateDecode/.test(dict) || /\/Fl\b/.test(dict))) { pos = sIdx + 6; continue; }

      // Extract dimensions and length
      const wm = dict.match(/\/Width\s+(\d+)/);
      const hm = dict.match(/\/Height\s+(\d+)/);
      const lm = dict.match(/\/Length\s+(\d+)/);
      if (!wm || !hm || !lm) { pos = sIdx + 6; continue; }
      const w = +wm[1], h = +hm[1], streamLen = +lm[1];
      if (w < 50 || h < 50 || w > 4000 || h > 4000) { pos = sIdx + 6; continue; }

      // Stream data starts after 'stream' + \r?\n
      let sStart = sIdx + 6;
      if (str[sStart] === "\r") sStart++;
      if (str[sStart] === "\n") sStart++;
      if (sStart + streamLen > buffer.length) { pos = sIdx + 6; continue; }

      try {
        const compressed = buffer.slice(sStart, sStart + streamLen);
        let raw = zlib.inflateSync(compressed);

        // Handle PNG row predictor (/Predictor >= 10)
        const pm = dict.match(/\/Predictor\s+(\d+)/);
        if (pm && +pm[1] >= 10) {
          const isGray = /DeviceGray/.test(dict);
          const isCmyk = /DeviceCMYK/.test(dict);
          const ch     = isCmyk ? 4 : isGray ? 1 : 3;
          const fixed  = undoPNGPredictor(raw, w, ch);
          if (!fixed) { pos = sStart + streamLen; continue; }
          raw = fixed;
        }

        // Determine colour space → channels
        const isGray = /DeviceGray/.test(dict);
        const isCmyk = /DeviceCMYK/.test(dict);
        const ch     = isCmyk ? 4 : isGray ? 1 : 3;
        if (raw.length < w * h * ch * 0.9) { pos = sStart + streamLen; continue; }

        const rgba = toRGBA(raw.slice(0, w * h * ch), ch);
        pixelCandidates.push({ rgba, width: w, height: h, label: `Flate ${w}×${h}` });
        flateFound++;
      } catch { /* inflate failed — not a valid stream */ }

      pos = sStart + streamLen;
    }
    console.log(`[Avatar] FlateDecode pass: ${flateFound} image stream(s) decoded`);
  }

  if (pixelCandidates.length === 0) { console.log("[Avatar] No decodable image found in PDF"); return null; }

  // ── Pick the most photo-like candidate by luminance variance ──────────────
  let bestRGBA = null, bestW = 0, bestH = 0, bestScore = -1;
  for (const c of pixelCandidates) {
    const v = photoVariance(c.rgba);
    console.log(`[Avatar] ${c.label}: ${c.width}×${c.height} variance=${v.toFixed(0)}`);
    if (v > bestScore) { bestScore = v; bestRGBA = c.rgba; bestW = c.width; bestH = c.height; }
  }

  const encoded = jpegJs.encode({ data: bestRGBA, width: bestW, height: bestH }, 88);
  const out = Buffer.from(encoded.data);
  console.log(`[Avatar] Selected score=${bestScore.toFixed(0)} → ${out.length}B JPEG`);
  return { data: out, mime: "image/jpeg" };
}

// Extract the largest embedded image from a DOCX buffer via mammoth's image handler.
// Returns { data: Buffer, mime: string } or null.
async function extractProfileImageFromDOCX(buffer) {
  const images = [];
  await mammoth.convertToHtml({ buffer }, {
    convertImage: mammoth.images.imgElement((image) =>
      image.read("buffer").then((buf) => {
        images.push({ data: buf, mime: image.contentType || "image/jpeg" });
        return { src: "" };
      })
    ),
  });
  if (images.length === 0) { console.log("[Avatar] DOCX: no images found"); return null; }
  // Pick largest by byte size — headshot photos are typically larger than diagrams/icons
  images.sort((a, b) => b.data.length - a.data.length);
  const best = images[0];
  console.log(`[Avatar] DOCX: ${images.length} image(s) found, using ${best.mime} ${best.data.length}B`);
  return best;
}

async function extractTextFromBuffer(buffer, mimeType) {
  if (mimeType === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error("Unsupported file type.");
}

async function parseWithAI(rawText) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter(Boolean);

  if (keys.length === 0) throw new Error("No GEMINI_API_KEY configured in environment variables.");

  const truncated = rawText.slice(0, 12000);

  const prompt = `You are a career data extraction assistant. Analyze the CV text below and return ONLY a valid JSON object — no markdown, no explanation.

The JSON must have exactly these keys:
- "profile": object with any of: first_name, last_name, phone, address, city, current_job_title, current_company, industry, linkedin_url, bio (only include fields clearly stated)
- "milestones": array of milestone objects
- "skills": flat string array of TECHNICAL SKILLS ONLY

Each milestone object must have:
- title (string, required)
- company (string or null)
- industry (one of: "Information Technology","Telecommunications","Finance & Banking","Healthcare","Education","Government","Manufacturing","Retail & E-commerce","Business Process Outsourcing (BPO)","Engineering","Media & Entertainment","Real Estate","Other", or null)
- start_date (YYYY-MM string or null)
- end_date (YYYY-MM string or null if current)
- is_current (boolean)
- location (string or null)
- description (1-2 sentence summary)
- skills_used (string array of technical skills used in this role)
- milestone_type (one of: "job","promotion","certification","award","education","other")

Skills extraction rules:
- "skills" must be a list of professional competency areas — NOT individual tool names.
- Group related technical skills found in the CV into clear professional labels. Examples:
  - HTML, CSS, JavaScript, React, Vue, Angular → "Frontend Development"
  - Node.js, Express, Python, Django, PHP, Laravel, Java, Spring Boot → "Backend Development"
  - MySQL, PostgreSQL, MongoDB, Firebase, Supabase → "Database Management"
  - AWS, Azure, GCP, Docker, Kubernetes, CI/CD, Linux → "Cloud & DevOps"
  - Python, R, pandas, TensorFlow, machine learning, data analysis → "Data Science & Analytics"
  - Swift, Kotlin, Android, iOS, React Native, Flutter → "Mobile Development"
  - Figma, Adobe XD, Sketch, Wireframing → "UI/UX Design"
  - Git, Jira, Agile, Scrum → "Project Management"
  - Networking, cybersecurity, penetration testing → "Network & Security"
  - Excel, SAP, QuickBooks, financial modeling, accounting software → "Financial & Accounting Tools"
  - Photoshop, Illustrator, video editing, Canva → "Graphic Design"
- If a skill does not fit any group above, create an appropriate short competency label for it.
- Return at most 8 competency areas.
- DO NOT include soft skills, personality traits ("leadership", "teamwork", "communication"), or vague terms ("computer literate", "internet", "Microsoft Office").
- Return empty array if no technical skills are found.

General rules: Only include profile fields clearly stated in the CV. Do not guess. Return empty arrays/objects if nothing found.

CV Text:
${truncated}`;

  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
  const keyLabels = keys.map((_, i) => (i === 0 ? "GEMINI_API_KEY" : `GEMINI_API_KEY_${i + 1}`));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Extract a suggested retry delay from the error message (e.g. "retry after 30s")
  const parseRetryDelay = (msg) => {
    const match = msg.match(/retry[^\d]*(\d+)\s*s/i);
    return match ? Math.min(parseInt(match[1]) * 1000, 15000) : 0;
  };

  console.log(`[AI] Starting parse — ${keys.length} key(s) configured, models: ${MODELS.join(", ")}`);

  let lastError;
  for (let m = 0; m < MODELS.length; m++) {
    const modelName = MODELS[m];
    for (let i = 0; i < keys.length; i++) {
      const keyLabel = keyLabels[i];
      // Wait between attempts: 1.5s between key switches, 3s when switching models
      const isFirstAttempt = m === 0 && i === 0;
      if (!isFirstAttempt) {
        const delay = i === 0 ? 3000 : 1500;
        console.log(`[AI] Waiting ${delay / 1000}s before next attempt…`);
        await sleep(delay);
      }

      console.log(`[AI] Trying ${modelName} / ${keyLabel}…`);
      try {
        const genAI = new GoogleGenerativeAI(keys[i]);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        console.log(`[AI] ✓ Success — ${modelName} / ${keyLabel}`);
        return parsed;
      } catch (err) {
        lastError = err;
        const msg = (err.message ?? "").toLowerCase();
        const isTransient = msg.includes("quota") || msg.includes("rate") ||
                            msg.includes("exhausted") || msg.includes("429") ||
                            msg.includes("503") || msg.includes("unavailable") ||
                            msg.includes("overloaded") || msg.includes("high demand") ||
                            msg.includes("try again") || err.status === 429 || err.status === 503;
        if (isTransient) {
          const suggested = parseRetryDelay(msg);
          const note = suggested ? ` (API suggests ${suggested / 1000}s wait)` : "";
          console.log(`[AI] ✗ ${modelName} / ${keyLabel} — transient error${note}: ${err.message?.slice(0, 80)}`);
          // If the API explicitly tells us to wait longer, honour it (cap at 15s)
          if (suggested > 1500) {
            console.log(`[AI] Honouring API retry delay: ${suggested / 1000}s`);
            await sleep(suggested);
          }
        } else {
          console.log(`[AI] ✗ ${modelName} / ${keyLabel} — non-transient error: ${err.message?.slice(0, 120)}`);
          throw err;
        }
      }
    }
  }
  console.log(`[AI] All models and keys exhausted. Last error: ${lastError?.message}`);
  throw lastError;
}

const router = Router();

// ── Get milestones for a profile ──
router.get("/:profileId/milestones", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("career_milestones")
      .select("*")
      .eq("profile_id", req.params.profileId)
      .order("start_date", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Add milestone ──
router.post("/milestones", authenticate, async (req, res, next) => {
  try {
    const milestone = { ...req.body, profile_id: req.user.id };
    const { data, error } = await supabase
      .from("career_milestones")
      .insert(milestone)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ── Update milestone ──
router.put("/milestones/:id", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("career_milestones")
      .update(req.body)
      .eq("id", req.params.id)
      .eq("profile_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Delete milestone ──
router.delete("/milestones/:id", authenticate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("career_milestones")
      .delete()
      .eq("id", req.params.id)
      .eq("profile_id", req.user.id);

    if (error) throw error;
    res.json({ message: "Milestone deleted" });
  } catch (err) {
    next(err);
  }
});

// ── AI Diagnostic (public, no auth) ──
router.get("/test-ai", async (req, res) => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter(Boolean);

  if (keys.length === 0)
    return res.json({ ok: false, step: "env", error: "No GEMINI_API_KEY configured" });

  const results = [];
  for (let i = 0; i < keys.length; i++) {
    const keyLabel = i === 0 ? "GEMINI_API_KEY" : `GEMINI_API_KEY_${i + 1}`;
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      await model.generateContent('Reply with exactly: {"ok":true}');
      results.push({ key: keyLabel, ok: true });
    } catch (err) {
      results.push({ key: keyLabel, ok: false, error: err.message });
    }
  }

  const anyOk = results.some(r => r.ok);
  res.json({ ok: anyOk, keys: results });
});

// ── CV Debug ──
// Shows what text was extracted from the last uploaded CV and optionally
// re-runs Gemini so you can see exactly what it returns.
// GET /api/career/cv-debug          → text extraction result + stored parse
// GET /api/career/cv-debug?rerun=1  → also calls Gemini live and shows raw output
router.get("/cv-debug", authenticate, async (req, res, next) => {
  try {
    const { data: record } = await supabase
      .from("cv_parsed_data")
      .select("*")
      .eq("profile_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!record) return res.json({ error: "No CV record found. Upload a CV first." });

    const out = {
      record_id:          record.id,
      status:             record.status,
      created_at:         record.created_at,
      raw_text_length:    record.raw_text?.length ?? 0,
      raw_text_preview:   record.raw_text ? record.raw_text.slice(0, 800) : null,
      stored_milestones:  record.parsed_milestones,
      stored_skills:      record.parsed_skills,
    };

    if (req.query.rerun === "1" || req.query.rerun === "true") {
      if (!record.raw_text) {
        out.rerun = { error: "No raw_text stored — cannot rerun. Re-upload your CV." };
      } else {
        const keys = [
          process.env.GEMINI_API_KEY,
          process.env.GEMINI_API_KEY_2,
          process.env.GEMINI_API_KEY_3,
          process.env.GEMINI_API_KEY_4,
        ].filter(Boolean);

        const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
        let geminiRaw = null;
        let geminiParsed = null;
        let geminiError = null;
        let modelUsed = null;
        let keyUsed = null;

        outer: for (const modelName of MODELS) {
          for (let i = 0; i < keys.length; i++) {
            try {
              const genAI = new GoogleGenerativeAI(keys[i]);
              const model = genAI.getGenerativeModel({ model: modelName });
              const truncated = record.raw_text.slice(0, 12000);
              const result = await model.generateContent(`You are a career data extraction assistant. Analyze the CV text and return ONLY valid JSON (no markdown) with keys: profile, milestones, skills.\n\nCV Text:\n${truncated}`);
              geminiRaw = result.response.text().trim();
              modelUsed = modelName;
              keyUsed = i === 0 ? "GEMINI_API_KEY" : `GEMINI_API_KEY_${i + 1}`;
              try { geminiParsed = JSON.parse(geminiRaw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim()); }
              catch { geminiParsed = null; }
              break outer;
            } catch (err) {
              geminiError = err.message;
            }
          }
        }

        out.rerun = {
          model_used:    modelUsed,
          key_used:      keyUsed,
          error:         geminiError,
          raw_response:  geminiRaw,
          parsed_result: geminiParsed,
        };
      }
    }

    res.json(out);
  } catch (err) {
    next(err);
  }
});

// ══════════════════════════════════════════
// CV UPLOAD & AI PARSING
// ══════════════════════════════════════════

// ── Upload CV ──
// Accepts a file upload, stores it in Supabase Storage,
// then triggers AI parsing to extract career milestones
router.post("/upload-cv", authenticate, async (req, res, next) => {
  try {
    // The frontend uploads the file directly to Supabase Storage and sends only
    // the resulting URL here — avoids the Vercel 4.5 MB serverless body limit.
    const { cvUrl, filePath, fileName, mimeType } = req.body;

    if (!cvUrl || !fileName) {
      return res.status(400).json({ error: "cvUrl and fileName are required" });
    }

    // Download the file so we can extract text and embedded images
    const fileResponse = await fetch(cvUrl);
    if (!fileResponse.ok) throw new Error(`Failed to fetch uploaded file: ${fileResponse.status}`);
    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    // Update profile with CV URL and clear existing skills so a reupload always starts fresh
    await supabase
      .from("profiles")
      .update({ cv_url: cvUrl, skills: [] })
      .eq("id", req.user.id);

    // Create a cv_parsed_data record in "processing" status
    const { data: parsedRecord, error: parseError } = await supabase
      .from("cv_parsed_data")
      .insert({
        profile_id: req.user.id,
        cv_url: cvUrl,
        status: "processing",
      })
      .select()
      .single();

    if (parseError) throw parseError;

    let rawText = "";
    let parsedData = null;
    let newStatus = "failed";

    try {
      rawText = await extractTextFromBuffer(fileBuffer, mimeType);
      parsedData = await parseWithAI(rawText);
      newStatus = "parsed";
    } catch (aiError) {
      console.error("[CV Parse] AI extraction failed:", aiError.message);
      console.error("[CV Parse] Stack:", aiError.stack);
      newStatus = aiError.message;
    }

    // ── Extract & upload profile photo from CV (best-effort) ──
    const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    let extractedAvatarUrl = null;
    const isExtractable = mimeType === "application/pdf" || mimeType === DOCX_MIME;
    if (isExtractable) {
      try {
        const imageResult = mimeType === "application/pdf"
          ? extractProfileImageFromPDF(fileBuffer)
          : await extractProfileImageFromDOCX(fileBuffer);
        if (imageResult) {
          const ext = imageResult.mime === "image/png" ? "png" : "jpg";
          const avatarPath = `avatars/${req.user.id}/${Date.now()}_avatar.${ext}`;
          const { error: avatarUploadError } = await supabase.storage
            .from("cv-uploads")
            .upload(avatarPath, imageResult.data, { contentType: imageResult.mime, upsert: true });
          if (avatarUploadError) {
            console.error("[Avatar] Storage upload failed:", avatarUploadError.message);
          } else {
            const { data: avatarUrlData } = supabase.storage
              .from("cv-uploads")
              .getPublicUrl(avatarPath);
            extractedAvatarUrl = avatarUrlData.publicUrl;
            console.log("[Avatar] Uploaded to storage:", extractedAvatarUrl);
            // Attach to parsedData so it appears in the response's parsedData.profile
            if (parsedData) {
              parsedData.profile = parsedData.profile || {};
              parsedData.profile.avatar_url = extractedAvatarUrl;
            }
          }
        }
      } catch (imgError) {
        console.error("[Avatar] Extraction failed:", imgError.message);
      }
    }

    const finalStatus = newStatus === "parsed" ? "parsed" : "failed";

    await supabase
      .from("cv_parsed_data")
      .update({
        raw_text:          rawText || null,
        parsed_milestones: parsedData?.milestones || [],
        parsed_skills:     parsedData?.skills     || [],
        status:            finalStatus,
      })
      .eq("id", parsedRecord.id);

    // Auto-save everything extracted from the CV directly to the profile
    const profileUpdate = {};

    if (finalStatus === "parsed" && parsedData) {
      const PROFILE_FIELDS = [
        "first_name", "last_name", "phone", "address", "city",
        "current_job_title", "current_company", "industry", "linkedin_url", "bio",
      ];
      if (parsedData.profile) {
        for (const field of PROFILE_FIELDS) {
          const val = parsedData.profile[field];
          if (val && String(val).trim()) profileUpdate[field] = val;
        }
      }
      if (parsedData.skills?.length > 0) profileUpdate.skills = parsedData.skills;
    }

    // Always save the avatar if one was extracted — regardless of whether AI parsing succeeded
    if (extractedAvatarUrl) profileUpdate.avatar_url = extractedAvatarUrl;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileSaveError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", req.user.id);
      if (profileSaveError) {
        console.error("[Avatar] Failed to save avatar_url to profile:", profileSaveError.message);
      } else if (extractedAvatarUrl) {
        console.log("[Avatar] avatar_url saved to profile successfully");
      }
    }

    res.status(201).json({
      message: finalStatus === "parsed"
        ? "CV uploaded and parsed successfully."
        : `CV uploaded but AI parsing failed: ${newStatus}`,
      cvUrl,
      parsedRecordId: parsedRecord.id,
      parsedData:     parsedData || null,
      status:         finalStatus,
    });
  } catch (err) {
    next(err);
  }
});

// ── Get parsed CV data ──
router.get("/cv-parsed", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("cv_parsed_data")
      .select("*")
      .eq("profile_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    res.json(data || null);
  } catch (err) {
    next(err);
  }
});

// ── Confirm AI-parsed milestones ──
// User reviews the AI-extracted milestones and confirms which ones to add
router.post("/cv-parsed/:id/confirm", authenticate, async (req, res, next) => {
  try {
    const { milestones } = req.body; // Array of milestone objects user confirmed

    if (!milestones || !Array.isArray(milestones)) {
      return res.status(400).json({ error: "Milestones array is required" });
    }

    // Normalize a date value to YYYY-MM-DD (Postgres DATE requires full date)
    const toDate = (val) => {
      if (!val) return null;
      if (/^\d{4}-\d{2}$/.test(val)) return `${val}-01`;   // YYYY-MM → YYYY-MM-01
      if (/^\d{4}$/.test(val)) return `${val}-01-01`;       // YYYY → YYYY-01-01
      return val;
    };

    // Insert confirmed milestones into career_milestones
    const milestonesWithProfile = milestones.map((m) => ({
      profile_id: req.user.id,
      title: m.title,
      company: m.company || null,
      industry: m.industry || null,
      description: m.description || null,
      milestone_type: m.milestone_type || "job",
      start_date: toDate(m.start_date),
      end_date: toDate(m.end_date),
      is_current: m.is_current || false,
      location: m.location || null,
      skills_used: m.skills_used || [],
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("career_milestones")
      .insert(milestonesWithProfile)
      .select();

    if (insertError) throw insertError;

    // Update cv_parsed_data status to confirmed
    await supabase
      .from("cv_parsed_data")
      .update({ status: "confirmed" })
      .eq("id", req.params.id)
      .eq("profile_id", req.user.id);

    res.json({
      message: `${inserted.length} career milestones added successfully`,
      milestones: inserted,
    });
  } catch (err) {
    next(err);
  }
});

// ── Retry AI parsing for a previously uploaded CV ──
router.post("/cv-parsed/:id/reparse", authenticate, async (req, res, next) => {
  try {
    const { data: record, error } = await supabase
      .from("cv_parsed_data")
      .select("*")
      .eq("id", req.params.id)
      .eq("profile_id", req.user.id)
      .single();

    if (error || !record) return res.status(404).json({ error: "Parsed CV record not found." });
    if (!record.raw_text) return res.status(400).json({ error: "No extracted text available. Please re-upload your CV." });

    await supabase
      .from("cv_parsed_data")
      .update({ status: "processing" })
      .eq("id", record.id);

    let parsedData = null;
    let finalStatus = "failed";

    try {
      parsedData = await parseWithAI(record.raw_text);
      finalStatus = "parsed";
    } catch (aiError) {
      console.error("[CV Reparse] AI extraction failed:", aiError.message);
    }

    await supabase
      .from("cv_parsed_data")
      .update({
        parsed_milestones: parsedData?.milestones || [],
        parsed_skills:     parsedData?.skills     || [],
        status:            finalStatus,
      })
      .eq("id", record.id);

    if (finalStatus === "parsed" && parsedData) {
      const PROFILE_FIELDS = [
        "first_name", "last_name", "phone", "address", "city",
        "current_job_title", "current_company", "industry", "linkedin_url", "bio",
      ];
      const profileUpdate = {};
      if (parsedData.profile) {
        for (const field of PROFILE_FIELDS) {
          const val = parsedData.profile[field];
          if (val && String(val).trim()) profileUpdate[field] = val;
        }
        if (parsedData.profile.avatar_url) profileUpdate.avatar_url = parsedData.profile.avatar_url;
      }
      if (parsedData.skills?.length > 0) profileUpdate.skills = parsedData.skills;
      if (Object.keys(profileUpdate).length > 0) {
        await supabase.from("profiles").update(profileUpdate).eq("id", req.user.id);
      }
    }

    res.json({
      message: finalStatus === "parsed"
        ? "AI parsing succeeded. Your profile has been updated."
        : "AI parsing failed again. Please try again later or re-upload your CV.",
      status: finalStatus,
      parsedData: parsedData || null,
      parsedRecordId: record.id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
