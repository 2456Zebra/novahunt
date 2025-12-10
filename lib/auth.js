// lib/auth.js
// Replace previous Upstash direct import with the wrapper client.
// This file provides a redis client for authentication-related uses.
// Usage in other modules: const redis = require('../lib/auth').redis;

const { createClient } = require('./redis-client');

const redis = createClient({
  // Prefer explicit envs if present; wrapper already reads from process.env.
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

module.exports = { redis };
