const { Router } = require("express");
const { authenticate } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const mammoth  = require("mammoth");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const jpegJs   = require("jpeg-js");

// Disable the web worker — not available in Node.js
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

// ── Avatar image extraction helpers ──────────────────────────────────────────

// Convert a pdfjs image object (kind 1/2/3) to a JPEG Buffer via jpeg-js.
function pdfImgToJpeg(img) {
  const { width, height, kind } = img;
  let rgba;
  if (kind === 3) {
    rgba = Buffer.from(img.data.buffer || img.data);
  } else if (kind === 2) {
    const src = img.data;
    rgba = Buffer.alloc(width * height * 4);
    for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
      rgba[j] = src[i]; rgba[j + 1] = src[i + 1]; rgba[j + 2] = src[i + 2]; rgba[j + 3] = 255;
    }
  } else if (kind === 1) {
    const src = img.data;
    rgba = Buffer.alloc(width * height * 4);
    for (let i = 0, j = 0; i < src.length; i++, j += 4) {
      rgba[j] = rgba[j + 1] = rgba[j + 2] = src[i] ? 255 : 0; rgba[j + 3] = 255;
    }
  } else {
    console.log(`[Avatar] Unsupported image kind: ${kind}`);
    return null;
  }
  const encoded = jpegJs.encode({ data: rgba, width, height }, 85);
  return Buffer.from(encoded.data);
}

// Fallback: scan raw PDF bytes for embedded JPEG streams (DCTDecode, Word/LibreOffice).
function extractProfileImageRawFallback(buffer) {
  let bestJpeg = null;
  let offset = 0;
  while (offset < buffer.length - 3) {
    if (buffer[offset] === 0xFF && buffer[offset + 1] === 0xD8) {
      const end = buffer.indexOf(Buffer.from([0xFF, 0xD9]), offset + 2);
      if (end !== -1) {
        const len = end + 2 - offset;
        if (len > 5000 && (!bestJpeg || len > bestJpeg.length)) {
          bestJpeg = buffer.slice(offset, end + 2);
        }
        offset = end + 2;
        continue;
      }
    }
    offset++;
  }
  if (!bestJpeg) { console.log("[Avatar] Raw fallback: no JPEG found"); return null; }
  console.log(`[Avatar] Raw fallback: found JPEG ${bestJpeg.length}B`);
  return { data: bestJpeg, mime: "image/jpeg" };
}

// Resolve a pdfjs image object by name, checking objs then commonObjs, with a timeout.
async function resolveImageObj(page, imgName) {
  const timeout = (ms) => new Promise((r) => setTimeout(() => r(null), ms));
  const fromObjs = await Promise.race([
    new Promise((r) => page.objs.get(imgName, r)),
    timeout(4000),
  ]);
  if (fromObjs) return fromObjs;

  const fromCommon = await Promise.race([
    new Promise((r) => page.commonObjs.get(imgName, r)),
    timeout(2000),
  ]);
  return fromCommon;
}

// Extract the largest image from a PDF buffer using pdfjs-dist.
// Handles both raw JPEG streams (Word/LibreOffice) and FlateDecode-compressed
// streams (Canva, Google Docs). Returns { data: Buffer, mime: string } or null.
async function extractProfileImageFromPDF(buffer) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    const pageCount = Math.min(pdf.numPages, 3);
    console.log(`[Avatar] pdfjs: ${pdf.numPages}-page PDF, scanning first ${pageCount} page(s)`);

    let bestImage = null;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const opList = await page.getOperatorList();
      const totalOps = opList.fnArray.length;
      let imageOpsCount = 0;

      for (let op = 0; op < opList.fnArray.length; op++) {
        const fn = opList.fnArray[op];

        // Inline images carry their pixel data directly in the args array
        if (fn === pdfjsLib.OPS.paintInlineImageXObject) {
          imageOpsCount++;
          const imgData = opList.argsArray[op][0];
          if (!imgData || !imgData.data) { console.log(`[Avatar] P${pageNum} op${op}: inline image has no data`); continue; }
          console.log(`[Avatar] P${pageNum} op${op}: inline ${imgData.width}×${imgData.height}`);
          if (imgData.width < 50 || imgData.height < 50) continue;
          const pixels = imgData.width * imgData.height;
          if (!bestImage || pixels > bestImage.width * bestImage.height) bestImage = imgData;
          continue;
        }

        if (fn !== pdfjsLib.OPS.paintImageXObject) continue;
        imageOpsCount++;

        const imgName = opList.argsArray[op][0];
        const img = await resolveImageObj(page, imgName);

        if (!img) {
          console.log(`[Avatar] P${pageNum} op${op}: "${imgName}" — timed out (not resolved from objs/commonObjs)`);
          continue;
        }
        if (!img.data) {
          console.log(`[Avatar] P${pageNum} op${op}: "${imgName}" — resolved but has no .data`);
          continue;
        }
        console.log(`[Avatar] P${pageNum} op${op}: "${imgName}" ${img.width}×${img.height} kind=${img.kind}`);
        if (img.width < 50 || img.height < 50) { console.log(`[Avatar] → too small, skipping`); continue; }

        const pixels = img.width * img.height;
        if (!bestImage || pixels > bestImage.width * bestImage.height) bestImage = img;
      }

      console.log(`[Avatar] P${pageNum}: ${totalOps} ops, ${imageOpsCount} image op(s) detected`);
    }

    if (!bestImage) {
      console.log("[Avatar] pdfjs found no usable images — trying raw byte scanner fallback");
      return extractProfileImageRawFallback(buffer);
    }

    console.log(`[Avatar] Best image: ${bestImage.width}×${bestImage.height} kind=${bestImage.kind}`);
    const jpegBuf = pdfImgToJpeg(bestImage);
    if (!jpegBuf) return extractProfileImageRawFallback(buffer);

    console.log(`[Avatar] JPEG encoded: ${jpegBuf.length}B`);
    return { data: jpegBuf, mime: "image/jpeg" };
  } catch (err) {
    console.log(`[Avatar] pdfjs extraction failed: ${err.message} — trying raw fallback`);
    return extractProfileImageRawFallback(buffer);
  }
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

    // ── Extract & upload profile photo from PDF (best-effort) ──
    let extractedAvatarUrl = null;
    if (mimeType === "application/pdf") {
      try {
        const imageResult = await extractProfileImageFromPDF(fileBuffer);
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
