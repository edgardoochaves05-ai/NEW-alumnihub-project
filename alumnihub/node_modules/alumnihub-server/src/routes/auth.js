const { Router } = require("express");
const { createClient } = require("@supabase/supabase-js");
const { supabase } = require("../config/supabase.js");
const { authenticate } = require("../middleware/auth.js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

    // Use the anon client so Supabase applies its normal email-confirmation
    // flow (sends the confirmation link to the user's inbox).
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const clientUrl = process.env.CLIENT_URL || "https://alumnihub-two.vercel.app";
    const { data, error } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name, role },
        emailRedirectTo: `${clientUrl}/dashboard`,
      },
    });

    if (error) {
      const status = error.status || error.statusCode || 400;
      return res.status(status).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: "Registration failed. Please try again." });
    }

    // Upsert the profile immediately with the service-role client (bypasses RLS)
    // so the row exists as soon as the user confirms their email and logs in.
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        role,
        first_name: first_name || "",
        last_name: last_name || "",
        is_active: true,
      },
      { onConflict: "id" }
    );

    res.status(201).json({ message: "Account created! Please check your email to confirm before signing in." });
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
