// lib/usage.js
// Usage tracking that relies on Redis. Now uses the wrapper.

const { createClient } = require('./redis-client');

const redis = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

module.exports = { redis };
