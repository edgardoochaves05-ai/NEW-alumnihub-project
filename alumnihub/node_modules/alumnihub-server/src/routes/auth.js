import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// ── Register ──
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role = "alumni" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const validRoles = ["alumni", "faculty"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { first_name, last_name, role },
      email_confirm: true,
    });

    if (error) throw error;
    res.status(201).json({ message: "Account created successfully", user: data.user });
  } catch (err) {
    next(err);
  }
});

// ── Get current user ──
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user, profile: req.profile });
});

export default router;
