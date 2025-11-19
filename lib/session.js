const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  console.warn('SESSION_SECRET not set — session token creation/verification will fail.');
}

function base64urlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\/g, '_').replace(/=+$/, '');
}
function base64urlDecodeToString(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function signString(payloadStr) {
  if (!SECRET) return '';
  return crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64').replace(/\+/g, '-').replace(/\/g, '_').replace(/=+$/, '');
}

async function createSessionForUser(userId, opts = {}) {
  if (!SECRET) throw new Error('SESSION_SECRET not configured');
  const iat = Math.floor(Date.now() / 1000);
  const ttl = opts.ttlSeconds || 60 * 60 * 24 * 30; // 30 days
  const exp = iat + ttl;
  const payload = { sub: String(userId), iat, exp };
  const payloadStr = JSON.stringify(payload);
  const token = `${base64urlEncode(Buffer.from(payloadStr, 'utf8'))}.${signString(payloadStr)}`;
  return { token, payload };
}

async function getUserBySession(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const payloadStr = base64urlDecodeToString(parts[0]);
    const sig = parts[1];
    const expected = signString(payloadStr);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(payloadStr);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload; // contains at least sub
  } catch (err) {
    console.error('session verification error', err?.message || err);
    return null;
  }
}

module.exports = { createSessionForUser, getUserBySession };