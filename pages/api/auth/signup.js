// Minimal signup example that creates a session cookie 'nh_session'.
// Replace the user creation logic with your real backend logic.

import { v4 as uuidv4 } from 'uuid';
import cookie from 'cookie';

const SESSIONS = new Map(); // simple in-memory map for demo; replace with DB

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Missing email or password' });

  try {
    // TODO: validate / store user in real DB. Here we create a demo session token.
    const token = uuidv4();
    const user = { id: token, email, createdAt: Date.now() };
    SESSIONS.set(token, user);

    // set HTTP-only cookie so the browser will send it for subsequent requests
    res.setHeader('Set-Cookie', cookie.serialize('nh_session', String(token), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    }));

    // return minimal success payload
    return res.status(200).json({ ok: true, user: { email } });
  } catch (err) {
    console.error('signup error', err);
    return res.status(500).json({ ok: false, error: 'Signup failed' });
  }
}
