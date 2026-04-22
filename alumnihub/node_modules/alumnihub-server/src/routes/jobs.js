const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");

const router = Router();

// ── Get all active jobs ──
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { industry, job_type, experience_level, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("job_listings")
      .select("*, profiles!posted_by(id, first_name, last_name, role, avatar_url)", { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (industry) query = query.eq("industry", industry);
    if (job_type) query = query.eq("job_type", job_type);
    if (experience_level) query = query.eq("experience_level", experience_level);
    if (search) query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ jobs: data, total: count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (err) {
    next(err);
  }
});

// ── Get matched jobs (AI) ──
router.get("/matched", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("job_match_scores")
      .select("*, job_listings(*, profiles!posted_by(id, first_name, last_name, role, avatar_url))")
      .eq("profile_id", req.user.id)
      .order("match_score", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Record a unique view (opens modal) ──
router.post("/:id/view", authenticate, async (req, res, next) => {
  try {
    await supabase
      .from("job_interactions")
      .upsert(
        { job_id: req.params.id, profile_id: req.user.id, interaction_type: "view" },
        { onConflict: "job_id,profile_id,interaction_type", ignoreDuplicates: true }
      );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Record a unique inquiry (apply button click) ──
router.post("/:id/inquire", authenticate, async (req, res, next) => {
  try {
    await supabase
      .from("job_interactions")
      .upsert(
        { job_id: req.params.id, profile_id: req.user.id, interaction_type: "inquiry" },
        { onConflict: "job_id,profile_id,interaction_type", ignoreDuplicates: true }
      );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Get single job ──
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("job_listings")
      .select("*, profiles!posted_by(id, first_name, last_name, role, avatar_url)")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Create job ──
router.post("/", authenticate, async (req, res, next) => {
  try {
    const {
      title, company, description, requirements, location,
      job_type, industry, salary_min, salary_max, salary_currency,
      required_skills, experience_level, application_url, application_email, expires_at,
    } = req.body;

    const job = {
      posted_by: req.user.id,
      title, company, description, requirements, location,
      job_type, industry, experience_level, application_url, application_email,
      ...(salary_currency && { salary_currency }),
      ...(salary_min !== "" && salary_min != null && { salary_min: parseFloat(salary_min) }),
      ...(salary_max !== "" && salary_max != null && { salary_max: parseFloat(salary_max) }),
      ...(required_skills && { required_skills }),
      ...(expires_at && { expires_at }),
    };

    const { data, error } = await supabase.from("job_listings").insert(job).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ── Update job ──
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("job_listings")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Delete job ──
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const { error } = await supabase.from("job_listings").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Job deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
