let app;

export default async function handler(req, res) {
  try {
    if (!app) {
      const mod = await import('../server/src/app.js');
      app = mod.default;
    }
    return app(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
let app;

export default async function handler(req, res) {
  try {
    // Load app on first request
    if (!app) {
      const appModule = await import('../server/src/app.js');
      app = appModule.default;
    }
    return app(req, res);
  } catch (err) {
    console.error('API error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
// Load the Express app on first request and cache it
let cachedApp;

async function loadApp() {
  if (cachedApp) return cachedApp;
  
  // Dynamic import of the ES module
  const appModule = await import('../server/src/app.js');
  cachedApp = appModule.default;
  return cachedApp;
}

module.exports = async function handler(req, res) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: err.message });
  }
};
