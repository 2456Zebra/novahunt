// lib/session.js — stateless HMAC-signed session tokens
const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || '';
if (!SECRET) {
  console.warn('SESSION_SECRET not set — session token creation/verification will fail.');
}

function base64urlEncode(buf) {
  var b = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf), 'utf8');
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecodeToString(str) {
  str = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function signString(payloadStr) {
  if (!SECRET) return '';
  return crypto.createHmac('sha256', SECRET).update(String(payloadStr)).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createSessionForUser(userId, opts) {
  opts = opts || {};
  if (!SECRET) throw new Error('SESSION_SECRET not configured');
  var iat = Math.floor(Date.now() / 1000);
  var ttl = typeof opts.ttlSeconds === 'number' ? opts.ttlSeconds : 60 * 60 * 24 * 30;
  var exp = iat + ttl;
  var payload = { sub: String(userId), iat: iat, exp: exp };
  var payloadStr = JSON.stringify(payload);
  var token = base64urlEncode(Buffer.from(payloadStr, 'utf8')) + '.' + signString(payloadStr);
  return { token: token, payload: payload };
}

function getUserBySession(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    var parts = token.split('.');
    if (!parts || parts.length !== 2) return null;
    var payloadStr = base64urlDecodeToString(parts[0]);
    var sig = parts[1] || '';
    var expected = signString(payloadStr);
    var a = Buffer.from(sig);
    var b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    var payload = JSON.parse(payloadStr);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (err) {
    console.error('session verification error', err && (err.message || err));
    return null;
  }
}

module.exports = { createSessionForUser, getUserBySession };
