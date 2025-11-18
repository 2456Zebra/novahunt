// Minimal signin endpoint. Normalizes email, verifies password using lib/user-store helpers when available.
import { json } from 'micro';
import * as userStore from '../../lib/user-store';

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = req.body || (await json(req));
  } catch (err) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' });
    return;
  }

  try {
    // If verifyPasswordForUser is available, use it
    if (typeof userStore.verifyPasswordForUser === 'function') {
      const ok = await userStore.verifyPasswordForUser(email, password);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } else if (typeof userStore.getUserByEmail === 'function') {
      // Fallback: check user exists and let user-store decide how to verify
      const u = await userStore.getUserByEmail(email);
      if (!u) return res.status(401).json({ error: 'Invalid email or password' });
      // If there is no verify helper, we cannot verify — return clear error.
      return res.status(501).json({ error: 'Server not configured: verifyPasswordForUser not implemented in lib/user-store.' });
    } else {
      return res.status(501).json({ error: 'Server not configured: no user-store helpers available.' });
    }

    // Create session if helper exists
    if (typeof userStore.createSessionForUser === 'function') {
      try {
        const session = await userStore.createSessionForUser({ email });
        if (session && session.token) {
          res.setHeader('Set-Cookie', `nh_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Secure`);
          return res.status(200).json({ ok: true });
        }
      } catch (e) {
        console.error('createSessionForUser failed', e);
      }
    }

    // If no session helper, just return OK and let client handle what to do next
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('signin error', err);
    res.status(500).json({ error: String(err?.message || err) });
  }
}
