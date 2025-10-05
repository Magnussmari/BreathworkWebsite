export default async function handler(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    method: req.method,
    env: process.env.NODE_ENV
  });
}
