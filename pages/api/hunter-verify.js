// Server-side endpoint to verify a single email using Hunter's Email Verifier (v2).
// WARNING: Each verification consumes Hunter credits. Rate-limit and cache results in production.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required in POST body' });

    const key = process.env.HUNTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'Hunter API key not configured' });

    // Basic input check
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    // Optional: simple in-memory cache to avoid repeated verifications during single cold start.
    // NOTE: serverless functions are ephemeral; use a persistent cache (Vercel KV, Redis) in production.
    if (!global.__hunter_verify_cache) global.__hunter_verify_cache = {};
    const cacheKey = `hv:${email.toLowerCase()}`;
    if (global.__hunter_verify_cache[cacheKey]) {
      return res.status(200).json({ cached: true, data: global.__hunter_verify_cache[cacheKey] });
    }

    const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${encodeURIComponent(key)}`;

    const r = await fetch(url);
    const text = await r.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      return res.status(502).json({ error: 'Hunter returned non-JSON', status: r.status, body: text });
    }

    if (!r.ok) {
      return res.status(502).json({ error: 'Hunter API error', status: r.status, body: json });
    }

    // Cache short-term to avoid immediate rechecks (ephemeral)
    try {
      global.__hunter_verify_cache[cacheKey] = json;
      // keep a small cache — TTL not implemented in this simple example
    } catch (e) {
      // ignore cache errors
    }

    return res.status(200).json({ data: json });
  } catch (err) {
    console.error('hunter-verify error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
