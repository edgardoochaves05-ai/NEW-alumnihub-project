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
