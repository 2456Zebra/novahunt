import { getOrCreateUserByEmail } from '../../lib/user-store';

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

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, error: 'Valid email is required' });
    }

    const user = await getOrCreateUserByEmail(email);

    // DEV: return userId so frontend can persist it. In prod this should be returned after email verification.
    return res.status(201).json({
      ok: true,
      message: 'Signup recorded (dev). Replace with real email provider in production.',
      userId: user.id,
    });
  } catch (err) {
    console.error('signup error', err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}