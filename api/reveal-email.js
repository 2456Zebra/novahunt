// api/reveal-email.js - demo-only reveal endpoint
// In production: server must verify user auth and Pro plan before revealing
export default async function handler(req, res) {
  const email = req.query.email || req.body?.email;
  if (!email) return res.status(400).json({ error: 'email required' });

  const provider = (process.env.PROVIDER || 'demo').toLowerCase();
  // Demo: allow reveal when ?demo=1 query param is present
  if (provider === 'demo' && req.query.demo === '1') {
    return res.status(200).json({ email });
  }

  return res.status(403).json({ error: 'Reveal requires Pro plan or demo=1' });
}