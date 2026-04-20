let app;

module.exports = async function handler(req, res) {
  try {
    if (!app) {
      const mod = await import('../server/src/app.js');
      app = mod.default;
    }
    return app(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
