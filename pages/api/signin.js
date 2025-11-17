import { getUserByEmail, verifyPasswordForUser, createSessionForUser } from '../../lib/user-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, error: 'Valid email is required' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password is required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password' });
    }

    const ok = await verifyPasswordForUser(email, password);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid email or password' });

    const session = await createSessionForUser(email);
    return res.status(200).json({ ok: true, message: 'Signed in', userId: user.id, session });
  } catch (err) {
    console.error('signin error', err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}