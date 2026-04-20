// Vercel serverless function handler
// This must be pure ES module syntax

export default async function handler(req, res) {
  console.log(`Handler called: ${req.method} ${req.url}`);
  
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    ok: true,
    method: req.method,
    url: req.url
  });
}
