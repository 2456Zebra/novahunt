// /api/signin.js
// Minimal magic-link placeholder. Replace with real email provider in production.

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // TODO: Implement real magic-link creation + send using SendGrid/SES/etc.
    console.log(`(DEV) Would send magic link to ${email}`);

    // For dev convenience, return a fake magic link to display in UI or logs
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const fakeLink = `${proto}://${host}/?magic_link=1&email=${encodeURIComponent(email)}`;
    return res.status(200).json({ ok: true, message: 'Magic link sent (dev)', link: fakeLink });
  } catch (err) {
    console.error('signin error', err);
    return res.status(500).json({ error: 'Unable to send sign-in link' });
  }
}