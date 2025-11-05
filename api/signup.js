// api/signup.js
// Vercel Serverless function: minimal signup placeholder. Replace with real DB and email verification for production.

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
    console.log(`(DEV) Would create user for ${email}`);
    return res.status(201).json({ ok: true, message: 'Account created (dev)', demoLeads: 50 });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ error: 'Unable to create account' });
  }
};
