const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");
const { computeJobMatches } = require("../services/ai/index.js");

const router = Router();

// ── Get all active jobs ──
// Default: only approved jobs. Admins can pass ?status=pending|declined|all
// to inspect the moderation queue.
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { industry, job_type, experience_level, search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("job_listings")
      .select("*, profiles!posted_by(id, first_name, last_name, role, avatar_url)", { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const isAdmin = req.profile?.role === "admin";
    if (isAdmin && status) {
      if (status !== "all") query = query.eq("status", status);
    } else {
      query = query.eq("status", "approved");
    }

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

// ── Get my own job postings (any status) ──
// Used by the poster's "My Listings" view so they can see pending /
// declined jobs that are hidden from the public feed.
router.get("/mine", authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from("job_listings")
      .select("*, profiles!posted_by(id, first_name, last_name, role, avatar_url)")
      .eq("posted_by", req.user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

// ── Get matched jobs (AI) ──
router.get("/matched", authenticate, async (req, res, next) => {
  try {
    let { data, error } = await supabase
      .from("job_match_scores")
      .select("*, job_listings!inner(*, profiles!posted_by(id, first_name, last_name, role, avatar_url))")
      .eq("profile_id", req.user.id)
      .eq("job_listings.status", "approved")
      .order("match_score", { ascending: false })
      .limit(20);

    if (error) throw error;

    // No scores yet for this user — compute on-demand and re-query
    if (!data || data.length === 0) {
      await computeJobMatches(req.user.id);
      const { data: fresh, error: freshError } = await supabase
        .from("job_match_scores")
        .select("*, job_listings!inner(*, profiles!posted_by(id, first_name, last_name, role, avatar_url))")
        .eq("profile_id", req.user.id)
        .eq("job_listings.status", "approved")
        .order("match_score", { ascending: false })
        .limit(20);
      if (freshError) throw freshError;
      data = fresh;
    }

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

// ── Get job interactions with profiles (admin only) ──
router.get("/:id/interactions", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { type } = req.query;
    let query = supabase
      .from("job_interactions")
      .select("profile_id, interaction_type, created_at, profiles(id, first_name, last_name, avatar_url, role, program, current_job_title)")
      .eq("job_id", req.params.id)
      .order("created_at", { ascending: false });
    if (type) query = query.eq("interaction_type", type);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
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

    // Hide non-approved listings from anyone other than the owner or an admin
    const isOwner = data?.posted_by === req.user.id;
    const isAdmin = req.profile?.role === "admin";
    if (data?.status !== "approved" && !isOwner && !isAdmin) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Create job ── (admins cannot post — they only moderate)
router.post("/", authenticate, async (req, res, next) => {
  try {
    if (req.profile?.role === "admin") {
      return res.status(403).json({ error: "Admins cannot post jobs. Admins moderate listings only." });
    }

    const {
      title, company, description, requirements, location,
      job_type, industry, salary_min, salary_max, salary_currency,
      required_skills, experience_level, application_url, application_email, expires_at,
    } = req.body;

    const job = {
      posted_by: req.user.id,
      title, company, description, requirements, location,
      job_type, industry, experience_level, application_url, application_email,
      status: "pending",
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

// ── Approve a pending job (admin only) ──
router.patch("/:id/approve", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("job_listings")
      .update({
        status: "approved",
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        decline_reason: null,
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// ── Decline a pending job (admin only) ──
router.patch("/:id/decline", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const { data, error } = await supabase
      .from("job_listings")
      .update({
        status: "declined",
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        decline_reason: reason || null,
      })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// ── Update job ──
// When the original poster edits a declined listing it goes back into the
// admin's pending queue automatically. Admins editing a job do not change
// its status (they only moderate via /approve and /decline).
router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from("job_listings")
      .select("posted_by, status")
      .eq("id", req.params.id)
      .single();
    if (fetchErr) throw fetchErr;

    const isOwner = existing.posted_by === req.user.id;
    const isAdmin = req.profile?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You can only edit your own job listings." });
    }

    // Strip moderation fields from the client payload — these are server-managed.
    const { status, reviewed_by, reviewed_at, decline_reason, posted_by, ...payload } = req.body || {};

    // Owner editing a declined listing → resubmit for review.
    if (isOwner && existing.status === "declined") {
      payload.status = "pending";
      payload.reviewed_by = null;
      payload.reviewed_at = null;
      payload.decline_reason = null;
    }

    const { data, error } = await supabase
      .from("job_listings")
      .update(payload)
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
    const { data: existing, error: fetchErr } = await supabase
      .from("job_listings")
      .select("posted_by")
      .eq("id", req.params.id)
      .single();
    if (fetchErr) throw fetchErr;

    const isOwner = existing.posted_by === req.user.id;
    const isAdmin = req.profile?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You can only delete your own job listings." });
    }

    const { error } = await supabase.from("job_listings").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Job deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
