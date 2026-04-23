const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");

const router = Router();

// ── GET /api/advice
// Returns combined notes + recommendations for the logged-in student,
// newest first. Each item includes advisor name and a "kind" discriminator.
router.get("/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const [notesRes, recsRes] = await Promise.all([
      supabase
        .from("advisor_notes")
        .select("id, content, is_read_by_student, created_at, advisor:advisor_id(id, first_name, last_name, avatar_url)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),

      supabase
        .from("advisor_recommendations")
        .select("id, title, description, type, url, is_read_by_student, created_at, advisor:advisor_id(id, first_name, last_name, avatar_url)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
    ]);

    if (notesRes.error) throw notesRes.error;
    if (recsRes.error) throw recsRes.error;

    const notes = (notesRes.data || []).map((n) => ({ ...n, kind: "note" }));
    const recs  = (recsRes.data  || []).map((r) => ({ ...r, kind: "recommendation" }));

    // Merge and sort by created_at descending
    const combined = [...notes, ...recs].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(combined);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/advice/unread-count
// Returns { count: N } — total unread notes + recommendations for the student.
router.get("/unread-count", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const [notesRes, recsRes] = await Promise.all([
      supabase
        .from("advisor_notes")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("is_read_by_student", false),

      supabase
        .from("advisor_recommendations")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("is_read_by_student", false),
    ]);

    if (notesRes.error) throw notesRes.error;
    if (recsRes.error) throw recsRes.error;

    res.json({ count: (notesRes.count || 0) + (recsRes.count || 0) });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/advice/mark-read
// Marks all of this student's unread notes and recommendations as read.
router.patch("/mark-read", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const [notesRes, recsRes] = await Promise.all([
      supabase
        .from("advisor_notes")
        .update({ is_read_by_student: true })
        .eq("student_id", studentId)
        .eq("is_read_by_student", false),

      supabase
        .from("advisor_recommendations")
        .update({ is_read_by_student: true })
        .eq("student_id", studentId)
        .eq("is_read_by_student", false),
    ]);

    if (notesRes.error) throw notesRes.error;
    if (recsRes.error) throw recsRes.error;

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
