console.log('[API] index.js loading...');

let app = null;
let appError = null;

// Import app module
import('../server/src/app.js')
  .then(module => {
    console.log('[API] App module imported');
    app = module.default;
    console.log('[API] App set successfully');
  })
  .catch(err => {
    console.error('[API] Failed to import app:', err.message);
    console.error('[API] Stack:', err.stack);
    appError = err;
  });

// Vercel serverless handler
export default async (req, res) => {
  try {
    console.log('[API] Handler called for:', req.method, req.url);
    
    if (appError) {
      console.error('[API] App failed to load:', appError.message);
      return res.status(500).json({ 
        error: 'App initialization failed',
        message: appError.message 
      });
    }
    
    if (!app) {
      console.error('[API] App not loaded yet');
      return res.status(500).json({ 
        error: 'App not ready',
        message: 'Server is still initializing' 
      });
    }
    
    console.log('[API] Calling Express app');
    return app(req, res);
  } catch (err) {
    console.error('[API] Handler error:', err.message);
    console.error('[API] Stack:', err.stack);
    return res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
};
