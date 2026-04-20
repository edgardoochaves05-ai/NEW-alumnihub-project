import app from '../server/src/app.js';

console.log('[API] App imported successfully');

// Vercel serverless handler
export default async (req, res) => {
  try {
    console.log('[API] Request:', req.method, req.url);
    return app(req, res);
  } catch (err) {
    console.error('[API] Handler error:', err.message);
    res.status(500).json({ 
      error: 'Server error',
      message: err.message 
    });
  }
};
