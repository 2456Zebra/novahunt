// pages/api/emails.js
// Example API route that uses Redis for simple email-related state.
// This replaces the previous file to use the wrapper client.

const { createClient } = require('../../lib/redis-client');

const redis = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

function json(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'method_not_allowed' });
  }

  const { email } = req.body || {};
  if (!email) return json(res, 400, { error: 'missing_email' });

  try {
    // Example: increment a counter per-email (rate-limiting demo)
    const key = `email:sent:${email}`;
    const cnt = await redis.incr(key);
    // Set a TTL (60 seconds) so counter decays (only for in-memory fallback; Upstash will accept expire)
    if (redis.expire) await redis.expire(key, 60);
    return json(res, 200, { ok: true, count: cnt });
  } catch (err) {
    console.error('emails handler error', err?.message || String(err));
    return json(res, 500, { error: 'internal' });
  }
}
