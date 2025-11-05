// /pages/api/signin.js
// Minimal magic-link placeholder. Replace with your email provider in production.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`(DEV) Would send magic link to ${email}`);
    } else {
      console.info('Signin request received');
    }

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const fakeLink = `${proto}://${host}/?magic_link=1&email=${encodeURIComponent(email)}`;

    // In production, send a real magic link via your email provider and do rate-limiting/captcha.
    return res.status(200).json({ ok: true, message: 'Magic link sent (dev)', link: fakeLink });
  } catch (err) {
    console.error('signin error', err);
    return res.status(500).json({ error: 'Unable to send sign-in link' });
  }
}
