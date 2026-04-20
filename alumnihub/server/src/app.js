import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

// Routes  
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profiles.js";
import careerRoutes from "./routes/career.js";
import jobRoutes from "./routes/jobs.js";
import messageRoutes from "./routes/messages.js";
import analyticsRoutes from "./routes/analytics.js";
import feedbackRoutes from "./routes/feedback.js";
import messageRequestRoutes from "./routes/messageRequests.js";
import announcementRoutes from "./routes/announcements.js";

// Config
import { isSupabaseConfigured } from "./config/supabase.js";

console.log("[APP] All modules imported successfully");

// Load environment variables - simple approach
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    supabaseConfigured: isSupabaseConfigured(),
  });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  
  // Check if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return res.status(500).json({
      error: "Database configuration error. Please ensure environment variables are set.",
      details: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are missing",
    });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

export default app;
