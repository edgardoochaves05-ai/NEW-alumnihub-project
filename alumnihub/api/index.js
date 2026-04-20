// Test handler - no dependencies
export default (req, res) => {
  res.json({ 
    status: 'test',
    method: req.method,
    path: req.url,
    timestamp: new Date().toISOString()
  });
};
