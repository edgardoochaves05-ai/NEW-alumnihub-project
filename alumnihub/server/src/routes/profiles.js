import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

const router = Router();

// ── Get my profile ──
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, career_milestones(*)")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Update my profile ──
router.put("/me", authenticate, async (req, res, next) => {
  try {
    const allowedFields = [
      "first_name", "last_name", "phone", "date_of_birth", "gender",
      "address", "city", "avatar_url", "bio", "student_number",
      "program", "department", "graduation_year", "batch_year",
      "current_job_title", "current_company", "industry",
      "skills", "linkedin_url", "is_private",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Get alumni list (with filters) ──
router.get("/alumni", authenticate, async (req, res, next) => {
  try {
    const { program, department, graduation_year, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("id, first_name, last_name, email, program, department, graduation_year, current_job_title, current_company, industry, avatar_url, gender", { count: "exact" })
      .eq("role", "alumni")
      .eq("is_active", true)
      .order("last_name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (program) query = query.eq("program", program);
    if (department) query = query.eq("department", department);
    if (graduation_year) query = query.eq("graduation_year", parseInt(graduation_year));
    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      alumni: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
});

// ── Get profile by ID ──
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, career_milestones(*)")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Profile not found" });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Upload Avatar ──
router.post("/avatar", authenticate, async (req, res, next) => {
  try {
    const { fileBase64, fileName, mimeType } = req.body;
    if (!fileBase64 || !fileName) return res.status(400).json({ error: "Missing file data." });

    const buffer = Buffer.from(fileBase64, "base64");
    const ext    = fileName.split(".").pop();
    const storagePath = `avatars/${req.user.id}-${Date.now()}.${ext}`;

    // Ensure the bucket exists (create if not)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === "cv-uploads");
    if (!bucketExists) {
      await supabase.storage.createBucket("cv-uploads", { public: true });
    }

    const { error: uploadErr } = await supabase.storage
      .from("cv-uploads")
      .upload(storagePath, buffer, { contentType: mimeType || "image/jpeg", upsert: true });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("cv-uploads").getPublicUrl(storagePath);
    const avatarUrl = urlData.publicUrl;

    // Save to profile
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ avatar_url: avatarUrl, profile: data });
  } catch (err) {
    next(err);
  }
});

// ── Verify alumni (Faculty/Admin) ──
router.patch("/:id/verify", authenticate, authorize("faculty", "admin"), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
