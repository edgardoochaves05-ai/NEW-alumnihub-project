let app;

// Dynamically import app to handle CommonJS/ESM interop
const loadApp = async () => {
  if (!app) {
    console.log("[API] Loading app from server/src/app.js");
    const module = await import("../server/src/app.js");
    app = module.default;
    console.log("[API] App loaded successfully");
  }
  return app;
};

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    console.log("[API HANDLER] Request:", req.method, req.url);
    const expressApp = await loadApp();
    console.log("[API HANDLER] Invoking Express app");
    return expressApp(req, res);
  } catch (err) {
    console.error("[API HANDLER] Error:", err.message);
    console.error("[API HANDLER] Stack:", err.stack);
    res.status(500).json({ error: "Internal Server Error", message: err.message, stack: err.stack });
  }
};
