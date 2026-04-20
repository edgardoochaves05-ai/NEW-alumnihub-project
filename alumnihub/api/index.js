import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

console.log('[API] index.js loading...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appPath = join(__dirname, '../server/src/app.js');

console.log('[API] App path:', appPath);

let app = null;
let appError = null;

// Import app module
(async () => {
  try {
    console.log('[API] Attempting to import from:', appPath);
    const module = await import(appPath);
    console.log('[API] App module imported successfully');
    app = module.default;
    console.log('[API] App set successfully, type:', typeof app);
  } catch (err) {
    console.error('[API] Failed to import app:', err.message);
    console.error('[API] Stack:', err.stack);
    appError = err;
  }
})();

// Vercel serverless handler
export default async (req, res) => {
  try {
    console.log('[API] Handler called for:', req.method, req.url);
    
    if (appError) {
      console.error('[API] App failed to load:', appError.message);
      return res.status(500).json({ 
        error: 'App initialization failed',
        message: appError.message,
        stack: appError.stack
      });
    }
    
    if (!app) {
      console.error('[API] App not loaded yet');
      return res.status(500).json({ 
        error: 'App not ready',
        message: 'Server is still initializing',
        appPath
      });
    }
    
    console.log('[API] Calling Express app');
    return app(req, res);
  } catch (err) {
    console.error('[API] Handler error:', err.message);
    console.error('[API] Stack:', err.stack);
    return res.status(500).json({ 
      error: 'Server error',
      message: err.message,
      stack: err.stack
    });
  }
};
