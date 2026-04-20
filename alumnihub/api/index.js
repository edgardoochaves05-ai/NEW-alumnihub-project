let app;

// Dynamically import app to handle CommonJS/ESM interop
const loadApp = async () => {
  if (!app) {
    const module = await import("../server/src/app.js");
    app = module.default;
  }
  return app;
};

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    const expressApp = await loadApp();
    return expressApp(req, res);
  } catch (err) {
    console.error("[API] Handler error:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
};
