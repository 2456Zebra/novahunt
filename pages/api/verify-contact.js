// Neutral verify endpoint: accepts POST { email } or GET ?email=...
// Returns provider verification payload in { data: ... } shape.
// Accepts both POST and GET to avoid 405 failures from unexpected client calls.
export default async function handler(req, res) {
  try {
    const method = req.method || 'GET';
    if (!['POST', 'GET'].includes(method)) {
      res.setHeader('Allow', 'POST, GET');
      return res.status(405).end('Method Not Allowed');
    }

    const email = method === 'POST' ? req.body?.email : req.query?.email;
    if (!email) return res.status(400).json({ error: 'email required' });

    const key = process.env.HUNTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'API key not configured' });

    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    // Basic ephemeral cache to reduce repeated verifies on warm instance
    if (!global.__verify_cache) global.__verify_cache = {};
    const cacheKey = `v:${email.toLowerCase()}`;
    if (global.__verify_cache[cacheKey]) {
      return res.status(200).json({ data: global.__verify_cache[cacheKey], cached: true });
    }

    const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${encodeURIComponent(key)}`;
    const r = await fetch(url);
    const text = await r.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      return res.status(502).json({ error: 'Upstream returned non-JSON', status: r.status, body: text });
    }
    if (!r.ok) return res.status(502).json({ error: 'Upstream API error', status: r.status, body: json });

    global.__verify_cache[cacheKey] = json;
    return res.status(200).json({ data: json });
  } catch (err) {
    console.error('verify-contact error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
