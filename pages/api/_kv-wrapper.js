// pages/api/_kv-wrapper.js
// Simple safe wrapper that other server code can use to interact with a Redis-like key/value store.
// This file now uses the wrapper createClient so it will gracefully fall back to in-memory when Upstash is archived.

const { createClient } = require('../../lib/redis-client');

const redis = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

module.exports = {
  // get value or null
  async get(key) {
    return await redis.get(String(key));
  },

  // set value (string), optional opts: { ex: seconds }
  async set(key, value, opts = {}) {
    return await redis.set(String(key), String(value), opts);
  },

  // delete key, returns number
  async del(key) {
    return await redis.del(String(key));
  },

  // increment key (returns number)
  async incr(key) {
    return await redis.incr(String(key));
  },

  // set TTL seconds
  async expire(key, seconds) {
    if (redis.expire) return await redis.expire(String(key), Number(seconds));
    // fallback emulate by reading/storing a TTL via set with EX
    return 0;
  },

  // ttl in seconds
  async ttl(key) {
    if (redis.ttl) return await redis.ttl(String(key));
    return -1;
  }
};
