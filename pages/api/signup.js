// pages/api/signup.js
const { createUser, getUserByEmail, getUsageForUser } = require('../../lib/user-store');
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

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ ok: false, error: emailValidation.error });
    }

    const normalized = emailValidation.normalized;
    const existing = await getUserByEmail(normalized);
    if (existing) return res.status(409).json({ ok: false, error: 'User already exists' });

    const user = await createUser({ email: normalized, password });
    const session = createSessionForUser(user.id);

    if (session && session.token) {
      const cookie = `nh_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
      res.setHeader('Set-Cookie', cookie);
    }

    const usage = await getUsageForUser(user.id);

    return res.status(201).json({ ok: true, email: user.email, session: session || null, usage });
  } catch (err) {
    const sanitized = sanitizeLogData('signup error', { email: req.body?.email, error: err?.message });
    console.error(sanitized);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
