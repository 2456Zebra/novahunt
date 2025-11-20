// pages/api/signin.js
const { getUserByEmail, verifyPasswordForUser, getUsageForUser } = require('../../lib/user-store');
const { createSessionForUser } = require('../../lib/session');
const { validateEmail, sanitizeLogData } = require('../../lib/validation');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    // Validate request body shape
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ ok: false, error: 'Invalid request body' });
    }

    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Missing email or password' });
    }

    if (typeof password !== 'string') {
      return res.status(400).json({ ok: false, error: 'Invalid password format' });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ ok: false, error: emailValidation.error });
    }

    const normalized = emailValidation.normalized;
    const user = await getUserByEmail(normalized);
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const valid = await verifyPasswordForUser(normalized, password);
    if (!valid) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    const session = createSessionForUser(user.id);

    if (session && session.token) {
      const cookie = `nh_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
      res.setHeader('Set-Cookie', cookie);
    }

    const usage = await getUsageForUser(user.id);

    return res.status(200).json({ ok: true, email: user.email, session: session || null, usage });
  } catch (err) {
    const sanitized = sanitizeLogData('signin error', { email: req.body?.email, error: err?.message });
    console.error(sanitized);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
