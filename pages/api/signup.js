// pages/api/signup.js
import { createUser, getUserByEmail } from '../../lib/user-store.js';
import { createSessionForUser } from '../../lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Missing email or password' });

    const normalized = String(email).toLowerCase().trim();
    const existing = await getUserByEmail(normalized);
    if (existing) return res.status(409).json({ ok: false, error: 'User already exists' });

    if (typeof createUser !== 'function') {
      return res.status(501).json({ ok: false, error: 'createUser not implemented in lib/user-store' });
    }

    const user = await createUser({ email: normalized, password });
    const session = await createSessionForUser(user.id);

    if (session && session.token) {
      const cookie = `nh_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
      res.setHeader('Set-Cookie', cookie);
    }

    return res.status(201).json({ ok: true, email: user.email, session: session || null });
  } catch (err) {
    console.error('signup error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
