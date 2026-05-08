const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");

const router = Router();

// ── GET /api/advice
// Returns ONLY recommendations for the logged-in student.
// Private notes are never sent over the network to students.
router.get("/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("advisor_recommendations")
      .select("*, advisor:advisor_id(id, first_name, last_name, avatar_url)")
      .eq("student_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const recs = (data || []).map((r) => ({ ...r, kind: "recommendation" }));
    res.json(recs);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/advice/unread-count
// Counts unread recommendations only. Returns { count: 0 } gracefully
// if the is_read_by_student column does not exist yet (migration not run).
router.get("/unread-count", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const { count, error } = await supabase
      .from("advisor_recommendations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", req.user.id)
      .eq("is_read_by_student", false);

    if (error) return res.json({ count: 0 });

    res.json({ count: count || 0 });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/advice/mark-read
// Marks all unread recommendations as read.
// No-ops gracefully if migration not run.
router.patch("/mark-read", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("advisor_recommendations")
      .update({ is_read_by_student: true })
      .eq("student_id", req.user.id)
      .eq("is_read_by_student", false);

    if (error) return res.json({ success: true, note: "migration pending" });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
