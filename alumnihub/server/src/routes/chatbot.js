const { Router } = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { authenticate, authorize } = require("../middleware/auth.js");
const { supabase } = require("../config/supabase.js");

const router = Router();

const SYSTEM_PROMPT = `You are AlumniBot, a friendly and helpful assistant for students using AlumniHub — an alumni tracking and career platform at the Technological Institute of the Philippines.

Your job is to help students with their inquiries. You can help with:
- Explaining how to use AlumniHub features (profile, jobs, messaging, career advice, settings)
- Career guidance: resume tips, interview prep, choosing a career path, skill-building
- Connecting with alumni and career advisors through the platform
- Understanding career predictions, job matching, and curriculum impact reports
- Academic and program-related questions

Style guidelines:
- Be warm, concise, and encouraging — talk like a supportive senior, not a corporate FAQ.
- Keep replies short (2–5 sentences) unless the student asks for detail.
- When pointing students to a feature, mention the sidebar item (e.g. "Jobs", "Career Advice", "My Profile").
- If asked something outside scope (general homework, unrelated topics), politely steer back to career/AlumniHub topics.
- Never invent platform features. If unsure, suggest contacting their career advisor through the Inbox.
- Do not provide medical, legal, or financial advice. Suggest seeing a professional instead.`;

function getApiKeys() {
  return [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ].filter(Boolean);
}

async function callGeminiChat(history, userMessage, studentContext) {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("No GEMINI_API_KEY configured.");

  const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];
  const systemInstruction =
    SYSTEM_PROMPT +
    (studentContext ? `\n\nStudent context (use only if relevant):\n${studentContext}` : "");

  let lastError;
  for (const modelName of MODELS) {
    for (const key of keys) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
        });
        const chat = model.startChat({
          history: history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        });
        const result = await chat.sendMessage(userMessage);
        return result.response.text().trim();
      } catch (err) {
        lastError = err;
        const msg = (err.message ?? "").toLowerCase();
        const isTransient =
          msg.includes("quota") || msg.includes("rate") ||
          msg.includes("exhausted") || msg.includes("429") ||
          msg.includes("503") || msg.includes("unavailable") ||
          msg.includes("overloaded") || msg.includes("high demand") ||
          msg.includes("try again") || err.status === 429 || err.status === 503;
        if (!isTransient) throw err;
      }
    }
  }
  throw lastError;
}

function buildStudentContext(profile) {
  if (!profile) return "";
  const parts = [];
  if (profile.first_name) parts.push(`Name: ${profile.first_name}`);
  if (profile.program) parts.push(`Program: ${profile.program}`);
  if (profile.year_level) parts.push(`Year level: ${profile.year_level}`);
  if (Array.isArray(profile.skills) && profile.skills.length) {
    parts.push(`Skills: ${profile.skills.slice(0, 10).join(", ")}`);
  }
  return parts.join("\n");
}

// ── POST /api/chatbot/message
// Body: { message: string, history?: [{ role: "user"|"assistant", content: string }] }
router.post("/message", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const { message, history } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message is required" });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "message too long (max 2000 chars)" });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
          .slice(-10)
      : [];

    const studentContext = buildStudentContext(req.profile);

    let reply;
    try {
      reply = await callGeminiChat(safeHistory, message.trim(), studentContext);
    } catch (err) {
      console.error("[chatbot] Gemini error:", err.message);
      return res.status(503).json({
        error: "The chatbot is unavailable right now. Please try again in a moment.",
      });
    }

    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
