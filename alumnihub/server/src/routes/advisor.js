const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");

const router = Router();

// ── Roster: assigned students with filters ─────────────────────────────────
router.get("/roster", authenticate, authorize("career_advisor", "admin"), async (req, res, next) => {
  try {
    const { search, program, department, employment_status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const advisorId = req.profile.role === "admin" ? req.query.advisor_id : req.user.id;

    if (!advisorId) return res.status(400).json({ error: "advisor_id required for admin queries" });

    const { data: assignments } = await supabase
      .from("advisor_assignments")
      .select("student_id")
      .eq("advisor_id", advisorId);

    if (!assignments?.length) {
      return res.json({ students: [], total: 0, page: 1, totalPages: 0 });
    }

    const studentIds = assignments.map(a => a.student_id);

    let query = supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, email, avatar_url, program, department, graduation_year, batch_year, current_job_title, current_company, industry, skills",
        { count: "exact" }
      )
      .in("id", studentIds)
      .order("last_name", { ascending: true })
      .range(offset, offset + Number(limit) - 1);

    if (search)   query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (program)  query = query.eq("program", program);
    if (department) query = query.eq("department", department);
    if (employment_status === "employed") query = query.not("current_company", "is", null).neq("current_company", "");
    if (employment_status === "seeking")  query = query.or("current_company.is.null,current_company.eq.");

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      students: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (err) { next(err); }
});

// ── List all career advisors (admin) ──────────────────────────────────────
router.get("/list", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, avatar_url, department")
      .eq("role", "career_advisor")
      .eq("is_active", true)
      .order("last_name");
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

// ── Get all assignments (admin) ────────────────────────────────────────────
router.get("/assignments", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("advisor_assignments")
      .select("id, assigned_at, advisor:advisor_id(id, first_name, last_name, email), student:student_id(id, first_name, last_name, program, department)")
      .order("assigned_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

// ── Create assignment (admin) ──────────────────────────────────────────────
router.post("/assignments", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { advisor_id, student_id } = req.body;
    if (!advisor_id || !student_id) {
      return res.status(400).json({ error: "advisor_id and student_id are required" });
    }
    const { data, error } = await supabase
      .from("advisor_assignments")
      .insert({ advisor_id, student_id, assigned_by: req.user.id })
      .select("id, assigned_at, advisor:advisor_id(id, first_name, last_name), student:student_id(id, first_name, last_name, program)")
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// ── Delete assignment (admin) ──────────────────────────────────────────────
router.delete("/assignments/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("advisor_assignments")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Search users for admin assignment modals ───────────────────────────────
router.get("/search-users", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { search, role } = req.query;
    if (!search || search.length < 2) return res.json([]);

    let query = supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, avatar_url, program, department")
      .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
      .eq("is_active", true)
      .limit(10);

    if (role) query = query.eq("role", role);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

// ── Notes: get for a student (advisor's own notes only) ───────────────────
router.get("/notes/:studentId", authenticate, authorize("career_advisor"), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("advisor_notes")
      .select("*")
      .eq("advisor_id", req.user.id)
      .eq("student_id", req.params.studentId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

// ── Notes: create ──────────────────────────────────────────────────────────
router.post("/notes", authenticate, authorize("career_advisor"), async (req, res, next) => {
  try {
    const { student_id, content } = req.body;
    if (!student_id || !content?.trim()) {
      return res.status(400).json({ error: "student_id and content are required" });
    }
    const { data, error } = await supabase
      .from("advisor_notes")
      .insert({ advisor_id: req.user.id, student_id, content: content.trim() })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// ── Notes: update ──────────────────────────────────────────────────────────
router.put("/notes/:id", authenticate, authorize("career_advisor"), async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Content is required" });
    const { data, error } = await supabase
      .from("advisor_notes")
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("advisor_id", req.user.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Note not found" });
    res.json(data);
  } catch (err) { next(err); }
});

// ── Notes: delete ──────────────────────────────────────────────────────────
router.delete("/notes/:id", authenticate, authorize("career_advisor"), async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("advisor_notes")
      .delete()
      .eq("id", req.params.id)
      .eq("advisor_id", req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Recommendations: get for a student ────────────────────────────────────
router.get("/recommendations/:studentId", authenticate, authorize("career_advisor"), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("advisor_recommendations")
      .select("*")
      .eq("advisor_id", req.user.id)
      .eq("student_id", req.params.studentId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { next(err); }
});

// ── Recommendations: create ────────────────────────────────────────────────
router.post("/recommendations", authenticate, authorize("career_advisor"), async (req, res, next) => {
  try {
    const { student_id, type, title, description, url } = req.body;
    if (!student_id || !title?.trim()) {
      return res.status(400).json({ error: "student_id and title are required" });
    }
    const { data, error } = await supabase
      .from("advisor_recommendations")
      .insert({ advisor_id: req.user.id, student_id, type: type || "other", title: title.trim(), description, url })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// ── Recommendations: delete ────────────────────────────────────────────────
router.delete("/recommendations/:id", authenticate, authorize("career_advisor"), async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("advisor_recommendations")
      .delete()
      .eq("id", req.params.id)
      .eq("advisor_id", req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
