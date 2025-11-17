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

    // Dev magic-link behaviour: return a placeholder link for testing and the userId
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'novahunt.ai';
    const link = `${proto}://${host}/?mock-signin=1&email=${encodeURIComponent(email)}&userId=${user.id}`;

    return res.status(200).json({
      ok: true,
      message: 'Signin link (dev-only) returned. Replace with real email delivery in production.',
      link,
      userId: user.id,
    });
  } catch (err) {
    console.error('signin error', err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}