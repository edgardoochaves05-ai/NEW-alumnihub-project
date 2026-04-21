const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");

const router = Router();

const VALID_CATEGORIES = ["Event", "Career Fair", "Campus News", "Mentorship"];

// Check if Supabase is available before processing requests
router.use((req, res, next) => {
  if (!supabase) {
    return res.status(500).json({
      error: "Database service unavailable. Check server configuration.",
    });
  }
  next();
});

// ── GET /api/announcements ─────────────────────────────────────
router.get("/", authenticate, async (req, res, next) => {
  try {
    console.log("[ANNOUNCEMENTS] GET / - user:", req.user?.id);
    const { limit = 10 } = req.query;
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, content, category, created_at, profiles!posted_by(first_name, last_name)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error("[ANNOUNCEMENTS] Query error:", error);
      throw error;
    }
    console.log("[ANNOUNCEMENTS] Returning", data?.length || 0, "announcements");
    res.json(data);
  } catch (err) {
    console.error("[ANNOUNCEMENTS] Error:", err);
    next(err);
  }
});

// ── GET /api/announcements/:id/comments ───────────────────────
router.get("/:id/comments", authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("feedback")
      .select("id, message, created_at, profiles!submitted_by(id, first_name, last_name, avatar_url, role)")
      .eq("category", "announcement_comment")
      .eq("subject", `announcement_${req.params.id}`)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/announcements/:id/comments ──────────────────────
router.post("/:id/comments", authenticate, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Comment cannot be empty." });
    }

    const { data, error } = await supabase
      .from("feedback")
      .insert({
        submitted_by: req.user.id,
        category: "announcement_comment",
        subject: `announcement_${req.params.id}`,
        message: message.trim(),
      })
      .select("id, message, created_at, profiles!submitted_by(id, first_name, last_name, avatar_url, role)")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/announcements (admin only) ──────────────────────
router.post("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { title, content, category, target_audience = "all" } = req.body;

    if (!title?.trim() || !content?.trim() || !category) {
      return res.status(400).json({ error: "Title, content, and category are all required." });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}.` });
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        title:          title.trim(),
        content:        content.trim(),
        category,
        target_audience,
        posted_by:      req.user.id,
        is_published:   true,
      })
      .select("id, title, content, category, created_at")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
