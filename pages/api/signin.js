// Sign-in endpoint: POST { email, password }
// Validates PBKDF2-stored password in KV (same hashing as set-password).
import { getKV } from './_kv-wrapper';
import crypto from 'crypto';
const kv = getKV();

function verifyPassword(password, stored) {
  // stored: { hash, salt, iterations, algorithm }
  const iterations = stored?.iterations || 150000;
  const salt = Buffer.from(stored?.salt || '', 'hex');
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return derived === stored?.hash;
}

function makeSessionString(email) {
  return JSON.stringify({ email, created_at: new Date().toISOString() });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const emailKey = String(email).toLowerCase();

    // read user
    let user;
    try {
      if (!kv) return res.status(500).json({ error: 'KV not available' });
      user = await kv.get(`user:${emailKey}`);
    } catch (e) {
      console.error('KV read error (signin)', e?.message || e);
      return res.status(500).json({ error: 'Server error' });
    }

    if (!user || !user.has_password || !user.password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // verify password
    const ok = verifyPassword(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid email or password' });

    // create session and persist local session
    const nhSession = makeSessionString(emailKey);
    try {
      await kv.set(`local:session:${emailKey}`, { nhSession, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 30 });
    } catch (e) {
      console.warn('KV write (local session)', e?.message || e);
    }

    // set cookie and return nh_session
    const cookie = `nh_session=${encodeURIComponent(nhSession)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ ok: true, email: emailKey, nh_session: nhSession });
  } catch (err) {
    console.error('signin error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
