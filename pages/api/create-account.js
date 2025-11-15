// Create account endpoint: POST { email, password? }
// If user exists, return 409 and don't create duplicate.
// If password provided, create password (same hashing as set-password).
import { getKV } from './_kv-wrapper';
import crypto from 'crypto';
const kv = getKV();

function hashPassword(password) {
  const iterations = 150000;
  const salt = crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
  return {
    hash: derived.toString('hex'),
    salt: salt.toString('hex'),
    iterations,
    algorithm: 'pbkdf2-sha512',
  };
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
    if (!email) return res.status(400).json({ error: 'email required' });
    const emailKey = String(email).toLowerCase();

    try {
      if (!kv) return res.status(500).json({ error: 'KV not available' });
      const existing = await kv.get(`user:${emailKey}`);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
      }

      // create user record
      const user = {
        email: emailKey,
        created_at: new Date().toISOString(),
        has_password: false,
        metadata: { created_via: 'self_signup' },
      };

      if (password && password.length >= 8) {
        const hashed = hashPassword(password);
        user.has_password = true;
        user.password = {
          hash: hashed.hash,
          salt: hashed.salt,
          iterations: hashed.iterations,
          algorithm: hashed.algorithm,
        };
      }

      await kv.set(`user:${emailKey}`, user);
      // create local session
      const nhSession = makeSessionString(emailKey);
      await kv.set(`local:session:${emailKey}`, { nhSession, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 30 });

      const cookie = `nh_session=${encodeURIComponent(nhSession)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
      res.setHeader('Set-Cookie', cookie);

      return res.status(201).json({ ok: true, email: emailKey, nh_session: nhSession });
    } catch (e) {
      console.error('create-account error', e?.message || e);
      return res.status(500).json({ error: 'Could not create account' });
    }
  } catch (err) {
    console.error('create-account outer error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
