import { verifyPasswordForUser } from '../../lib/user-store';
import { createSessionForUser } from '../../lib/session';

function makeSessionString(token) {
  return token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const emailKey = String(email).toLowerCase().trim();

    // verify password using file-store helper
    let ok = false;
    let verifyError = null;
    try {
      ok = await verifyPasswordForUser(emailKey, password);
    } catch (e) {
      verifyError = String(e?.message || e);
      ok = false;
    }

    if (!ok) {
      // In non-debug mode return generic error to avoid user enumeration
      if (process.env.DEBUG_SIGNIN === 'true') {
        return res.status(400).json({ error: 'Invalid email or password', detail: verifyError || 'invalid' });
      }
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // create a stateless signed session token
    const token = await createSessionForUser(emailKey);
    const nhSession = makeSessionString(token);

    // Set a cookie (optional) and return session in body
    const cookie = `nh_session=${encodeURIComponent(nhSession)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ ok: true, email: emailKey, nh_session: nhSession });
  } catch (err) {
    console.error('signin error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
