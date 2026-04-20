const { Router } = require("express");
const { supabase } = require("../config/supabase.js");
const { authenticate } = require("../middleware/auth.js");

const router = Router();

// Guard: supabase must be configured
router.use((req, res, next) => {
  if (!supabase) {
    return res.status(503).json({
      error: "Database service unavailable. Check server configuration.",
      details: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.",
    });
  }
  next();
});

// ── Register ──
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role = "alumni" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const validRoles = ["alumni", "faculty", "admin", "student"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { first_name, last_name, role },
      email_confirm: true,
    });

    if (error) {
      const status = error.status || error.statusCode || 400;
      return res.status(status).json({ error: error.message });
    }
    res.status(201).json({ message: "Account created successfully", user: data.user });
  } catch (err) {
    console.error("[REGISTER] Unexpected error:", err.message);
    next(err);
  }
});

// ── Get current user ──
router.get("/me", authenticate, (req, res) => {
  res.json({ user: req.user, profile: req.profile });
});

module.exports = router;
