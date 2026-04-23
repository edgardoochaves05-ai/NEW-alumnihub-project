const { Router } = require("express");
const { authenticate } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const mammoth  = require("mammoth");

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
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in environment variables.");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const truncated = rawText.slice(0, 12000);

  const prompt = `You are a career data extraction assistant. Analyze the CV text below and return ONLY a valid JSON object — no markdown, no explanation.

The JSON must have exactly these keys:
- "profile": object with any of: first_name, last_name, phone, city, current_job_title, current_company, industry, linkedin_url, bio (only include fields clearly stated)
- "milestones": array of milestone objects
- "skills": flat string array of all skills mentioned

Each milestone object must have:
- title (string, required)
- company (string or null)
- industry (one of: "Information Technology","Telecommunications","Finance & Banking","Healthcare","Education","Government","Manufacturing","Retail & E-commerce","Business Process Outsourcing (BPO)","Engineering","Media & Entertainment","Real Estate","Other", or null)
- start_date (YYYY-MM string or null)
- end_date (YYYY-MM string or null if current)
- is_current (boolean)
- location (string or null)
- description (1-2 sentence summary)
- skills_used (string array)
- milestone_type (one of: "job","promotion","certification","award","education","other")

Rules: Only include profile fields clearly stated in the CV. Do not guess. Return empty arrays/objects if nothing found.

CV Text:
${truncated}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
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
    }

    await supabase
      .from("cv_parsed_data")
      .update({
        raw_text:          rawText || null,
        parsed_milestones: parsedData?.milestones || [],
        parsed_skills:     parsedData?.skills     || [],
        status:            newStatus,
      })
      .eq("id", parsedRecord.id);

    res.status(201).json({
      message: newStatus === "parsed"
        ? "CV uploaded and parsed successfully."
        : "CV uploaded but AI parsing failed. You can add milestones manually.",
      cvUrl,
      parsedRecordId: parsedRecord.id,
      parsedData:     parsedData || null,
      status:         newStatus,
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

    // Insert confirmed milestones into career_milestones
    const milestonesWithProfile = milestones.map((m) => ({
      profile_id: req.user.id,
      title: m.title,
      company: m.company,
      industry: m.industry,
      description: m.description,
      milestone_type: m.milestone_type || "job",
      start_date: m.start_date,
      end_date: m.end_date,
      is_current: m.is_current || false,
      location: m.location,
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

    // Update profile skills from parsed data
    const { data: parsedData } = await supabase
      .from("cv_parsed_data")
      .select("parsed_skills")
      .eq("id", req.params.id)
      .single();

    if (parsedData?.parsed_skills?.length) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("skills")
        .eq("id", req.user.id)
        .single();

      const existingSkills = profile?.skills || [];
      const mergedSkills = [...new Set([...existingSkills, ...parsedData.parsed_skills])];

      await supabase
        .from("profiles")
        .update({ skills: mergedSkills })
        .eq("id", req.user.id);
    }

    res.json({
      message: `${inserted.length} career milestones added successfully`,
      milestones: inserted,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
