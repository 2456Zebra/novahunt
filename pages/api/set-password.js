// Endpoint to set a password using a one-time token created after checkout.
// Body: { token: "<token>", password: "<new-password>" }
// Returns: { ok: true, nh_session } on success.
import { getKV } from './_kv-wrapper';
const kv = getKV();
import crypto from 'crypto';

function hashPassword(password, salt = null) {
  const iterations = 150000;
  const saltBuf = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
  const derived = crypto.pbkdf2Sync(password, saltBuf, iterations, 64, 'sha512');
  return {
    salt: saltBuf.toString('hex'),
    iterations,
    derived: derived.toString('hex'),
    algorithm: 'pbkdf2-sha512',
  };
}

function makeSessionString(email) {
  const payload = {
    email,
    created_at: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'token and password required' });
    if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const tokenKey = `user:setpw:${token}`;
    let tokenRecord;
    try {
      if (!kv) return res.status(500).json({ error: 'KV not available' });
      tokenRecord = await kv.get(tokenKey);
    } catch (e) {
      console.warn('KV read error (set-password token)', e?.message || e);
      return res.status(500).json({ error: 'KV read error' });
    }

    if (!tokenRecord || !tokenRecord.email) return res.status(400).json({ error: 'Invalid or expired token' });

    const emailKey = tokenRecord.email.toLowerCase();

    // Hash and store password on user record
    const hashed = hashPassword(password);
    try {
      const existing = (await kv.get(`user:${emailKey}`)) || {};
      const updated = {
        ...existing,
        email: emailKey,
        has_password: true,
        password: {
          hash: hashed.derived,
          salt: hashed.salt,
          iterations: hashed.iterations,
          algorithm: hashed.algorithm,
        },
        updated_at: new Date().toISOString(),
      };
      await kv.set(`user:${emailKey}`, updated);
      // delete the token
      await kv.del(tokenKey);
    } catch (e) {
      console.error('KV write error (set password)', e?.message || e);
      return res.status(500).json({ error: 'Could not save password' });
    }

    // create nh_session and persist local session record
    const nhSessionString = makeSessionString(emailKey);
    try {
      await kv.set(`local:session:${emailKey}`, { nhSession: nhSessionString, created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 * 30 });
    } catch (e) {
      console.warn('KV write (local session) failed', e?.message || e);
    }

    const cookieValue = encodeURIComponent(nhSessionString);
    const cookie = `nh_session=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ ok: true, email: emailKey, nh_session: nhSessionString });
  } catch (err) {
    console.error('set-password error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
