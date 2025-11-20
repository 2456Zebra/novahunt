// pages/api/signin.js
const { getUserByEmail, verifyPasswordForUser, getUsageForUser } = require('../../lib/user-store');
const { createSessionForUser } = require('../../lib/session');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Missing email or password' });

    const normalized = String(email).toLowerCase().trim();
    const user = await getUserByEmail(normalized);
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const valid = await verifyPasswordForUser(normalized, password);
    if (!valid) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const session = createSessionForUser(user.id);
    const usage = await getUsageForUser(user.id);

    if (session && session.token) {
      const cookie = `nh_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
      res.setHeader('Set-Cookie', cookie);
    }

    return res.status(200).json({ ok: true, email: user.email, session: session || null, usage });
  } catch (err) {
    console.error('signin error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
