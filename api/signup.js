// /api/signup.js
// Minimal signup placeholder. Replace with real user DB and verification.

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
    // TODO: Persist user to DB, send verification, provision demo credits
    console.log(`(DEV) Would create user for ${email}`);

    // Dev response: created + demo credits
    return res.status(201).json({ ok: true, message: 'Account created (dev)', demoLeads: 50 });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ error: 'Unable to create account' });
  }
}