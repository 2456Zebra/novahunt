// pages/api/set-password.js
// Forwards set-password requests to your auth backend as configured via BACKEND_AUTH_URL env var.
// Expects: POST { email, password, token? }
// If BACKEND_AUTH_URL is not set, returns 501 with instructions.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, token } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const backend = process.env.BACKEND_AUTH_URL || '';

  if (!backend) {
    return res.status(501).json({
      error: 'BACKEND_AUTH_URL not configured. Configure BACKEND_AUTH_URL to point to your auth service endpoint that accepts { email, password, token } and updates/creates the user record. Example: process.env.BACKEND_AUTH_URL = "https://api.myapp.com/auth/set-password"'
    });
  }

  try {
    const r = await fetch(backend, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, token }),
    });

    const j = await r.json().catch(() => null);

    if (!r.ok) {
      return res.status(r.status).json({ error: j && j.error ? j.error : 'backend error', details: j });
    }

    // success
    return res.status(200).json({ ok: true, result: j });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach backend', message: err && err.message });
  }
}
