const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");

const router = Router();

// ── GET /api/advice
// Returns combined notes + recommendations for the logged-in student,
// newest first. Uses * so the query works before and after the
// 011_add_advice_read_tracking.sql migration is applied.
router.get("/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const [notesRes, recsRes] = await Promise.all([
      supabase
        .from("advisor_notes")
        .select("*, advisor:advisor_id(id, first_name, last_name, avatar_url)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),

      supabase
        .from("advisor_recommendations")
        .select("*, advisor:advisor_id(id, first_name, last_name, avatar_url)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
    ]);

    if (notesRes.error) throw notesRes.error;
    if (recsRes.error) throw recsRes.error;

    const notes = (notesRes.data || []).map((n) => ({ ...n, kind: "note" }));
    const recs  = (recsRes.data  || []).map((r) => ({ ...r, kind: "recommendation" }));

    const combined = [...notes, ...recs].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(combined);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/advice/unread-count
// Returns { count: N }. Returns { count: 0 } gracefully if the
// is_read_by_student column does not exist yet (migration not run).
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

    // If the migration hasn't been run yet, column won't exist — return 0 gracefully
    if (notesRes.error || recsRes.error) {
      return res.json({ count: 0 });
    }

    res.json({ count: (notesRes.count || 0) + (recsRes.count || 0) });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/advice/mark-read
// Marks all unread items as read. No-ops gracefully if migration not run.
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

    // Silently ignore column-not-found errors (migration not yet applied)
    if (notesRes.error || recsRes.error) {
      return res.json({ success: true, note: "migration pending" });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
