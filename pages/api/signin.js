// File-based signin handler — uses lib/user-store.js for user lookup and session creation.
// This preserves the file-based backend behavior while integrating with the Copilot frontend.
import { getUserByEmail, verifyPasswordForUser, createSessionForUser } from '../../lib/user-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Missing email or password' });
    }

    const normalized = String(email).toLowerCase().trim();
    const user = await getUserByEmail(normalized);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    const valid = await verifyPasswordForUser(normalized, password);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }

    // createSessionForUser should return a session token / id that can be used by other APIs.
    const session = await createSessionForUser(user.id);

    // Optionally set a cookie if session.token exists
    if (session?.token) {
      const cookie = `nh_session=${session.token}; Path=/; HttpOnly; SameSite=Lax`;
      // add ; Secure in production HTTPS if desired
      res.setHeader('Set-Cookie', cookie);
    }

    return res.status(200).json({ ok: true, email: user.email, session: session || null });
  } catch (err) {
    console.error('signin error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
