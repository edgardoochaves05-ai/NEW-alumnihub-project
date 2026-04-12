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

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Error Handler ──
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`AlumniHub API running on http://localhost:${PORT}`);
});

export default app;
