let app = null;

module.exports = async (req, res) => {
  try {
    // Lazy load the Express app on first request
    if (!app) {
      console.log('[Handler] Loading Express app...');
      const appModule = await import('../server/src/app.js');
      app = appModule.default;
      console.log('[Handler] Express app loaded');
    }

    console.log(`[Handler] ${req.method} ${req.url}`);
    
    // Call the Express app as middleware
    return app(req, res);
  } catch (error) {
    console.error('[Handler] Error:', error.message);
    console.error('[Handler] Stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      type: error.constructor.name
    });
  }
};
