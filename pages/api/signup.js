import { getUserByEmail, createUserWithPassword, createSessionForUser } from '../../lib/user-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }

    const { email, password } = req.body;
    const e = typeof email === 'string' ? email.trim() : '';
    const p = typeof password === 'string' ? password : '';

    if (!e || !EMAIL_RE.test(e)) {
      return res.status(400).json({ ok: false, error: 'Valid email is required' });
    }

    if (!p || p.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    }

    const existing = await getUserByEmail(e);
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Account already exists' });
    }

    const user = await createUserWithPassword(e, p);
    const session = await createSessionForUser(e);

    return res.status(201).json({ ok: true, message: 'Account created', userId: user.id, session });
  } catch (err) {
    console.error('signup error', err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}