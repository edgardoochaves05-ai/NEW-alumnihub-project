import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

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

    // TODO: Trigger actual AI parsing here
    // In production, this would call an AI service (e.g., Anthropic API)
    // to extract career milestones from the CV text.
    // For now, we simulate by setting status to "parsed" with placeholder data.
    //
    // The flow is:
    // 1. Extract text from PDF/DOCX (using pdf-parse or mammoth)
    // 2. Send extracted text to AI API for structured extraction
    // 3. Store parsed milestones in cv_parsed_data.parsed_milestones
    // 4. User reviews and confirms on the frontend
    // 5. Confirmed milestones get inserted into career_milestones table

    res.status(201).json({
      message: "CV uploaded successfully. AI is processing your career milestones.",
      cvUrl,
      parsedRecordId: parsedRecord.id,
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

export default router;
