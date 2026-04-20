const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

// Routes - import them directly
const authRoutes = require("./routes/auth.js");
const profileRoutes = require("./routes/profiles.js");
const careerRoutes = require("./routes/career.js");
const jobRoutes = require("./routes/jobs.js");
const messageRoutes = require("./routes/messages.js");
const analyticsRoutes = require("./routes/analytics.js");
const feedbackRoutes = require("./routes/feedback.js");
const messageRequestRoutes = require("./routes/messageRequests.js");
const announcementRoutes = require("./routes/announcements.js");

console.log("[APP] All routes imported successfully");

// Config
const { supabase, isSupabaseConfigured } = require("./config/supabase.js");

console.log("[APP] Config imported");

// Load environment variables
dotenv.config();


const app = express();

// Log startup
console.log("✓ Express app created");
console.log("✓ Supabase configured:", isSupabaseConfigured());

// ── Middleware ──
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health Check (Public) ──
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    supabaseConfigured: isSupabaseConfigured(),
    environment: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing",
    clientUrl: process.env.CLIENT_URL || "not set",
  });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/career", careerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/message-requests", messageRequestRoutes);
app.use("/api/announcements", announcementRoutes);

console.log("[APP] Routes registered");

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  console.error("Stack:", err.stack);
  
  // Check if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return res.status(500).json({
      error: "Database configuration error",
      details: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing",
      supabaseUrl: Boolean(process.env.SUPABASE_URL),
      supabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  }
  
  // If supabase is null, that's the problem
  if (!supabase) {
    return res.status(500).json({
      error: "Database client not initialized",
      details: "Supabase client is null despite env vars being set",
    });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    path: req.path,
    method: req.method,
  });
});

module.exports = app;
