// Minimal, clear signup endpoint. Normalizes email and uses lib/user-store helpers when available.
import { json } from 'micro';

import * as userStore from '../../../lib/user-store';

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
    // If getUserByEmail exists, check for existing account
    if (typeof userStore.getUserByEmail === 'function') {
      const existing = await userStore.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists. Sign in instead.', code: 'exists' });
        return;
      }
    }

    // Require a createUser helper; if not present surface a clear error
    if (typeof userStore.createUser !== 'function') {
      res.status(501).json({
        error: 'Server not configured: createUser not implemented in lib/user-store. Implement createUser({email,password}) to persist users.',
      });
      return;
    }

    const created = await userStore.createUser({ email, password });

    // If createSessionForUser exists, create a session and set cookie
    if (typeof userStore.createSessionForUser === 'function') {
      try {
        const session = await userStore.createSessionForUser(created);
        if (session && session.token) {
          // Basic cookie; adjust flags to your security requirements
          res.setHeader('Set-Cookie', `nh_session=${session.token}; Path=/; HttpOnly; SameSite=Lax; Secure`);
        }
      } catch (e) {
        // ignore session creation errors, but log server-side
        console.error('createSessionForUser failed', e);
      }
    }

    res.status(201).json({ ok: true, id: created?.id || created?._id || null });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ error: String(err?.message || err) });
  }
}
