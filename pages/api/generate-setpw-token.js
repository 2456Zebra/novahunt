// Generate a one-time set-password token for an email (for testing / manual flow).
// Body: { email: "user@example.com" }
// Returns: { ok:true, token: "<token>", url: "/set-password?token=..." }
import { getKV } from './_kv-wrapper';
import crypto from 'crypto';
const kv = getKV();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { email } = req.body || {};
    if (!email) {
      res.status(400).end(JSON.stringify({ error: 'email required' }));
      return;
    }

    const token = generateToken();
    const tokenKey = `user:setpw:${token}`;
    try {
      await kv.set(tokenKey, { email: email.toLowerCase(), created_at: new Date().toISOString() }, { ex: 60 * 60 * 24 });
    } catch (e) {
      console.warn('KV write error (generate-setpw-token)', e?.message || e);
      res.status(500).end(JSON.stringify({ error: 'Could not persist token' }));
      return;
    }

    const url = `/set-password?token=${token}`;
    res.status(200).end(JSON.stringify({ ok: true, token, url }));
  } catch (err) {
    console.error('generate-setpw-token error', err?.message || err);
    res.status(500).end(JSON.stringify({ error: 'Server error' }));
  }
}
