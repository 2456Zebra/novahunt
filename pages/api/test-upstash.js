// pages/api/test-upstash.js
// Simple server-side test for Upstash REST Redis connectivity.
// Deploy this (Preview or Production) and call /api/test-upstash from your browser.
// It returns non-secret results (ping, set/get) or an explanatory error.

export default async function handler(req, res) {
  const url = process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';

  if (!url || !token) {
    return res.status(200).json({
      ok: false,
      reason: 'no_env',
      message: 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set in envs'
    });
  }

  try {
    // Dynamically require the client so local dev without the package won't crash the whole build
    // (You should have @upstash/redis in package.json for Production).
    // We only return non-secret results.
    // eslint-disable-next-line global-require
    const { Redis } = require('@upstash/redis'); 
    const r = new Redis({ url, token });

    const ping = await r.ping();
    // set a short-lived test key
    const testKey = `novahunt_test_key_${Math.floor(Math.random()*10000)}`;
    await r.set(testKey, 'ok', { ex: 10 });
    const val = await r.get(testKey);

    return res.status(200).json({
      ok: true,
      mode: 'upstash_rest',
      ping,
      testKey,
      testValue: val,
      note: 'No secrets are returned. If this is successful, your Vercel deployment is connecting to Upstash.'
    });
  } catch (err) {
    // If the Upstash client isn't available or credentials are invalid, return an explanatory message.
    return res.status(500).json({
      ok: false,
      reason: 'connect_error',
      message: String(err?.message || err),
      detail: 'Check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel envs and redeploy.'
    });
  }
}
