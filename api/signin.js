// api/signin.js
// Vercel Serverless function: minimal magic-link placeholder. Replace with your email provider in production.

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch (e) { return {}; }
}

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = parseBody(req);
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    console.log(`(DEV) Would send magic link to ${email}`);
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost';
    const fakeLink = `${proto}://${host}/?magic_link=1&email=${encodeURIComponent(email)}`;
    return res.status(200).json({ ok: true, message: 'Magic link sent (dev)', link: fakeLink });
  } catch (err) {
    console.error('signin error', err);
    return res.status(500).json({ error: 'Unable to send sign-in link' });
  }
};
