const { Router } = require("express");
const { authenticate } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
const mammoth  = require("mammoth");

// Scan a PDF buffer for embedded images (JPEG and PNG).
// Returns { data: Buffer, mime: string } for the largest candidate found, or null.
function extractProfileImageFromPDF(buffer) {
  const candidates = [];

  // ── JPEG: SOI = FF D8 FF, EOI = FF D9 ──
  let i = 0;
  while (i < buffer.length - 3) {
    if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8 && buffer[i + 2] === 0xFF) {
      const start = i;
      let j = start + 4;
      let found = false;
      while (j < buffer.length - 1) {
        if (buffer[j] === 0xFF && buffer[j + 1] === 0xD9) {
          const size = j + 2 - start;
          if (size > 2000) candidates.push({ start, end: j + 2, size, mime: "image/jpeg" });
          i = j + 2;
          found = true;
          break;
        }
        j++;
      }
      if (!found) break;
    } else {
      i++;
    }
  }

  // ── PNG: signature 89 50 4E 47 0D 0A 1A 0A, ends with IEND chunk AE 42 60 82 ──
  const PNG_SIG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const IEND    = [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];
  i = 0;
  while (i < buffer.length - 8) {
    if (PNG_SIG.every((b, k) => buffer[i + k] === b)) {
      const start = i;
      let j = start + 8;
      let found = false;
      while (j < buffer.length - 8) {
        if (IEND.every((b, k) => buffer[j + k] === b)) {
          const size = j + 8 - start;
          if (size > 2000) candidates.push({ start, end: j + 8, size, mime: "image/png" });
          i = j + 8;
          found = true;
          break;
        }
        j++;
      }
      if (!found) break;
    } else {
      i++;
    }
  }

  if (candidates.length === 0) {
    console.log("[Avatar] No embedded images found in PDF");
    return null;
  }

  console.log(`[Avatar] Found ${candidates.length} image(s):`, candidates.map(c => `${c.mime} ${c.size}B`));

  // Use the largest image — profile photos are bigger than icons/logos
  const best = candidates.reduce((a, b) => (b.size > a.size ? b : a));
  console.log(`[Avatar] Selected: ${best.mime} ${best.size}B`);
  return { data: buffer.slice(best.start, best.end), mime: best.mime };
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

  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
  let lastError;
  for (const modelName of MODELS) {
    for (const key of keys) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        return JSON.parse(cleaned);
      } catch (err) {
        lastError = err;
        const msg = (err.message ?? "").toLowerCase();
        const isTransient = msg.includes("quota") || msg.includes("rate") ||
                            msg.includes("exhausted") || msg.includes("429") ||
                            msg.includes("503") || msg.includes("unavailable") ||
                            msg.includes("overloaded") || msg.includes("high demand") ||
                            msg.includes("try again") || err.status === 429 || err.status === 503;
        if (!isTransient) throw err;
      }
    }
  }
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

// ══════════════════════════════════════════
// CV UPLOAD & AI PARSING
// ══════════════════════════════════════════

// ── Upload CV ──
// Accepts a file upload, stores it in Supabase Storage,
// then triggers AI parsing to extract career milestones
router.post("/upload-cv", authenticate, async (req, res, next) => {
  try {
    // Note: In production, use multer or busboy middleware for file handling.
    // The frontend sends this as multipart/form-data.
    // For now, we expect the file to be base64 encoded in the body.
    const { fileBase64, fileName, mimeType } = req.body;

    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: "File data and filename are required" });
    }

    const fileBuffer = Buffer.from(fileBase64, "base64");
    const filePath = `cvs/${req.user.id}/${Date.now()}_${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("cv-uploads")
      .upload(filePath, fileBuffer, {
        contentType: mimeType || "application/pdf",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("cv-uploads")
      .getPublicUrl(filePath);

    const cvUrl = urlData.publicUrl;

    // Update profile with CV URL
    await supabase
      .from("profiles")
      .update({ cv_url: cvUrl })
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
    if (mimeType === "application/pdf") {
      try {
        const imageResult = extractProfileImageFromPDF(fileBuffer);
        if (imageResult) {
          const ext = imageResult.mime === "image/png" ? "png" : "jpg";
          const avatarPath = `avatars/${req.user.id}/${Date.now()}_avatar.${ext}`;
          const { error: avatarUploadError } = await supabase.storage
            .from("cv-uploads")
            .upload(avatarPath, imageResult.data, { contentType: imageResult.mime, upsert: true });
          if (!avatarUploadError) {
            const { data: avatarUrlData } = supabase.storage
              .from("cv-uploads")
              .getPublicUrl(avatarPath);
            if (parsedData) {
              parsedData.profile = parsedData.profile || {};
              parsedData.profile.avatar_url = avatarUrlData.publicUrl;
            }
          }
        }
      } catch (imgError) {
        console.error("[CV Parse] Avatar extraction failed:", imgError.message);
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

    // Auto-save competency areas to the profile immediately, replacing any previous skills
    if (finalStatus === "parsed" && parsedData?.skills?.length > 0) {
      await supabase.from("profiles").update({ skills: parsedData.skills }).eq("id", req.user.id);
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

module.exports = router;
