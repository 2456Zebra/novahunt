// /pages/api/signup.js
// Minimal signup placeholder. Replace with real DB and email verification for production.

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

  // Basic shape guard
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`(DEV) Would create user for ${email}`);
    } else {
      console.info('Signup request received');
    }

    // TODO: Replace with real DB insertion and email verification provider (SendGrid/SES)
    return res.status(201).json({ ok: true, message: 'Account created (dev)', demoLeads: 50 });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ error: 'Unable to create account' });
  }
}
