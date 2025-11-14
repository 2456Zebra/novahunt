// Server-side: call Hunter domain-search and return provider payload under { data: ... }.
// Uses Vercel KV if available for short-term caching to reduce repeated calls.
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { domain, limit = 50, offset = '' } = req.body || {};
    if (!domain) return res.status(400).json({ error: 'domain required in POST body' });

    const key = process.env.HUNTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'HUNTER_API_KEY not configured' });

    const cacheKey = `hunter:search:${domain.toLowerCase()}:${limit}:${offset}`;
    // Try KV cache first if available
    try {
      if (typeof kv !== 'undefined') {
        const cached = await kv.get(cacheKey);
        if (cached) return res.status(200).json(cached);
      }
    } catch (e) {
      // KV not available or error — continue
      console.warn('KV read error', e);
    }

    const limitPart = limit ? `&limit=${encodeURIComponent(limit)}` : '';
    const offsetPart = offset ? `&offset=${encodeURIComponent(offset)}` : '';
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}${limitPart}${offsetPart}&api_key=${encodeURIComponent(key)}`;

    const r = await fetch(url);
    const text = await r.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      return res.status(502).json({ error: 'Upstream returned non-JSON', status: r.status, body: text });
    }

    if (!r.ok) return res.status(502).json({ error: 'Upstream API error', status: r.status, body: json });

    const payload = { data: json };

    // Store in KV for short TTL to save credits
    try {
      if (typeof kv !== 'undefined') {
        await kv.set(cacheKey, payload, { ex: 60 * 30 }); // 30 minute TTL
      }
    } catch (e) {
      console.warn('KV write error', e);
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error('search-contacts error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
