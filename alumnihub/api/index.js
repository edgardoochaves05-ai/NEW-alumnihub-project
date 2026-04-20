let expressApp;

// Load Express app
async function initializeApp() {
  if (!expressApp) {
    try {
      console.log('[API] Initializing Express app');
      const mod = await import('../server/src/app.js');
      expressApp = mod.default;
      console.log('[API] Express app initialized');
    } catch (err) {
      console.error('[API] Failed to initialize app:', err);
      throw err;
    }
  }
  return expressApp;
}

// Initialize on module load
initializeApp().catch(err => {
  console.error('[API] Initialization error:', err.message);
});

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    if (!expressApp) {
      console.log('[API] App not ready, initializing...');
      await initializeApp();
    }
    return expressApp(req, res);
  } catch (err) {
    console.error('[API] Handler error:', err.message);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
};
