let app = null;

module.exports = async (req, res) => {
  try {
    // Lazy load the Express app on first request
    if (!app) {
      const appModule = await import('../server/src/app.js');
      app = appModule.default;
    }

    // Call the Express app
    app(req, res);
  } catch (error) {
    console.error('Handler error:', error.message);
    res.status(500).json({ 
      error: error.message,
      type: error.constructor.name
    });
  }
};
