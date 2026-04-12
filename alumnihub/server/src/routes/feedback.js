import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

const router = Router();

// ── Submit feedback ──
router.post("/", authenticate, async (req, res, next) => {
  try {
    const { category, subject, message } = req.body;
    const { data, error } = await supabase
      .from("feedback")
      .insert({ submitted_by: req.user.id, category, subject, message })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// ── Get feedback (own or all for admin) ──
router.get("/", authenticate, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("feedback")
      .select("*, profiles!submitted_by(first_name, last_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.profile.role !== "admin") {
      query = query.eq("submitted_by", req.user.id);
    }
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ feedback: data, total: count, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
});

// ── Update feedback status (Admin) ──
router.patch("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const { status, admin_response } = req.body;
    const { data, error } = await supabase
      .from("feedback")
      .update({ status, admin_response })
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
