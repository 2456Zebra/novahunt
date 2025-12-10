// lib/redis-client.js
// Drop-in wrapper for @upstash/redis createClient usage.
// - Tries to instantiate the real Upstash Redis client (require('@upstash/redis')) when env vars are present.
// - If that fails (archived DB or missing envs), falls back to an in-memory Map-based store that provides:
//   get(key), set(key, value, opts), del(key), incr(key), expire(key, seconds), ttl(key).
//
// Usage:
//   const { createClient } = require('../lib/redis-client');
//   const redis = createClient(); // returns either a real Upstash client or the in-memory fallback
//
// Note: in-memory fallback is ephemeral (lost on process restart) — use only for short-term testing.

function makeInMemoryClient() {
  const store = new Map(); // key -> { value: string, expiresAt: number|null }
  function now() { return Date.now(); }

  function cleanupIfExpired(key) {
    const rec = store.get(key);
    if (!rec) return false;
    if (rec.expiresAt && rec.expiresAt <= now()) {
      store.delete(key);
      return true;
    }
    return false;
  }

  return {
    // get returns string|null to match upstash simple behavior
    async get(key) {
      cleanupIfExpired(key);
      const rec = store.get(key);
      if (!rec) return null;
      return rec.value;
    },

    // set(key, value, opts) - opts may be { ex: seconds } or { px: ms } or omitted
    async set(key, value, opts = {}) {
      let expiresAt = null;
      if (opts && typeof opts === 'object') {
        if (typeof opts.ex === 'number') {
          expiresAt = now() + opts.ex * 1000;
        } else if (typeof opts.px === 'number') {
          expiresAt = now() + opts.px;
        } else if (opts.EX && typeof opts.EX === 'number') {
          expiresAt = now() + opts.EX * 1000;
        }
      }
      store.set(String(key), { value: String(value), expiresAt });
      return 'OK';
    },

    async del(key) {
      const existed = store.delete(String(key));
      return existed ? 1 : 0;
    },

    // incr: increments numeric value, returns new number
    async incr(key) {
      cleanupIfExpired(key);
      const cur = await this.get(key);
      const n = Number(cur || 0) + 1;
      await this.set(key, String(n));
      return n;
    },

    // expire: set TTL in seconds, return 1 if set, 0 otherwise
    async expire(key, seconds) {
      const rec = store.get(String(key));
      if (!rec) return 0;
      rec.expiresAt = now() + Math.max(0, seconds) * 1000;
      store.set(String(key), rec);
      return 1;
    },

    // ttl in seconds (or -2 if not exists, -1 if exists but no TTL) similar semantics
    async ttl(key) {
      const rec = store.get(String(key));
      if (!rec) return -2;
      if (!rec.expiresAt) return -1;
      const ms = rec.expiresAt - now();
      return ms <= 0 ? -2 : Math.ceil(ms / 1000);
    },

    // for debug
    _dump() {
      const out = {};
      for (const [k, v] of store.entries()) {
        out[k] = { value: v.value, expiresAt: v.expiresAt };
      }
      return out;
    }
  };
}

function createClient(opts = {}) {
  // Accept either createClient({ url, token }) or createClient(url, token) style
  let url = opts.url || opts.redisUrl || opts.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
  let token = opts.token || opts.tokenValue || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // If user passed string args like createClient(url, token)
  if (!url && typeof opts === 'string') {
    url = opts;
  }

  // Try to use the real Upstash client if envs present and package available
  if (url && token) {
    try {
      // eslint-disable-next-line global-require
      const { Redis } = require('@upstash/redis');
      // If the package is available, create a Redis client using provided url/token.
      const client = new Redis({ url, token });
      // The Redis class already provides get/set/del/incr etc. Return it directly.
      return client;
    } catch (err) {
      // If requiring/constructing the real client fails (archived or library missing), fall through to fallback.
      // Do not print secrets — only log a short message for debugging.
      // eslint-disable-next-line no-console
      console.warn('Upstash client unavailable, falling back to in-memory store:', err?.message || String(err));
    }
  } else {
    // If no url/token present, log and use fallback
    // eslint-disable-next-line no-console
    console.info('Upstash env vars not set — using in-memory Redis fallback for testing.');
  }

  // Return in-memory fallback client
  return makeInMemoryClient();
}

module.exports = { createClient };
