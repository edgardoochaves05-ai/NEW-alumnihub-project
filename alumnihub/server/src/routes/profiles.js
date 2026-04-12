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
      "skills", "linkedin_url",
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
