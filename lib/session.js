const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  // Don't throw in require-time to avoid breaking builds in environments where you only run tests,
  // but log an obvious warning in runtime if missing.
  console.warn('SESSION_SECRET not set — session token creation/verification will fail.');
}

function base64urlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecodeToString(str) {
  // pad if necessary
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function signString(payloadStr) {
  return crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function createSessionForUser(email, opts = {}) {
  if (!SECRET) throw new Error('SESSION_SECRET not configured');
  const iat = Math.floor(Date.now() / 1000);
  // default TTL 30 days
  const ttl = opts.ttlSeconds || 60 * 60 * 24 * 30;
  const exp = iat + ttl;
  const payload = { email: String(email).toLowerCase(), iat, exp };
  const payloadStr = JSON.stringify(payload);
  const token = `${base64urlEncode(Buffer.from(payloadStr, 'utf8'))}.${signString(payloadStr)}`;
  return token;
}

async function getUserBySession(token) {
  if (!token) return null;
  if (!SECRET) throw new Error('SESSION_SECRET not configured');
  try {
    const parts = String(token).split('.');
    if (parts.length !== 2) return null;
    const payloadB64 = parts[0];
    const sig = parts[1];
    const payloadStr = base64urlDecodeToString(payloadB64);
    const expectedSig = signString(payloadStr);
    // Use timingSafeEqual to avoid timing attacks
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(payloadStr);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    // Return a minimal user object that other code expects (at least email)
    return { email: payload.email, iat: payload.iat, exp: payload.exp };
  } catch (err) {
    console.error('session verification error', err?.message || err);
    return null;
  }
}

module.exports = {
  createSessionForUser,
  getUserBySession,
};
