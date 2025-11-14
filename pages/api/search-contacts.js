// Server-side: call Hunter domain-search and return provider payload under { data: ... }.
// Tries requested limit first; if Hunter returns pagination_error (free plan limited to 10),
// retries with limit=10 so the user gets results instead of a 502.
// Filters out inferred/guessed addresses (no sources AND not explicitly verified) so UI shows only higher-trust Hunter records.
import { kv } from '@vercel/kv';

function makeHunterUrl(domain, limit = 10, offset = '') {
  const limitPart = limit ? `&limit=${encodeURIComponent(limit)}` : '';
  const offsetPart = offset ? `&offset=${encodeURIComponent(offset)}` : '';
  const key = process.env.HUNTER_API_KEY || '';
  return `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}${limitPart}${offsetPart}&api_key=${encodeURIComponent(key)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { domain, limit = 10, offset = '' } = req.body || {};
    if (!domain) return res.status(400).json({ error: 'domain required in POST body' });

    const key = process.env.HUNTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'HUNTER_API_KEY not configured' });

    // Normalize limit: make integer and sensible default
    let requestedLimit = parseInt(limit, 10);
    if (isNaN(requestedLimit) || requestedLimit <= 0) requestedLimit = 10;
    requestedLimit = Math.min(requestedLimit, 100);

    const cacheKey = `hunter:search:${domain.toLowerCase()}:${requestedLimit}:${offset}`;

    // Try KV cache first if available
    try {
      if (typeof kv !== 'undefined') {
        const cached = await kv.get(cacheKey);
        if (cached) return res.status(200).json(cached);
      }
    } catch (e) {
      console.warn('KV read error', e);
    }

    // Helper to call hunter and parse JSON
    async function callHunter(limitToUse) {
      const url = makeHunterUrl(domain, limitToUse, offset);
      const r = await fetch(url);
      const text = await r.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        // upstream returned non-JSON
        return { ok: false, status: r.status, body: text, json: null };
      }
      return { ok: r.ok, status: r.status, body: json, json };
    }

    // First attempt with requestedLimit
    const first = await callHunter(requestedLimit);

    // If upstream returned pagination error (free plan limit), retry with 10
    if (!first.ok && first.body && first.body.errors && Array.isArray(first.body.errors)) {
      const paginationError = first.body.errors.find((err) => err?.id === 'pagination_error' || err?.code === 400);
      if (paginationError) {
        // retry with safe limit = 10
        const fallback = await callHunter(10);
        if (!fallback.ok) {
          // still failed — return 502 with upstream body
          return res.status(502).json({ error: 'Upstream API error', status: fallback.status, body: fallback.body });
        }
        const payload = { data: fallback.json };

        // Filter out inferred/guessed emails: keep those with sources or explicitly verified
        try {
          if (payload?.data?.data?.emails && Array.isArray(payload.data.data.emails)) {
            payload.data.data.emails = payload.data.data.emails.filter((e) => {
              if (!e) return false;
              if (Array.isArray(e.sources) && e.sources.length > 0) return true;
              if (e.verification && e.verification.status === 'valid') return true;
              return false; // drop inferred/guessed entries
            });
          }
        } catch (e) {
          console.warn('filter error', e);
        }

        // cache short TTL if KV available
        try {
          if (typeof kv !== 'undefined') {
            await kv.set(cacheKey, payload, { ex: 60 * 30 }); // 30 minutes
          }
        } catch (e) {
          console.warn('KV write error', e);
        }
        return res.status(200).json(payload);
      }
    }

    // If first call failed for other reasons, return 502 with body so client can show message
    if (!first.ok) {
      return res.status(502).json({ error: 'Upstream API error', status: first.status, body: first.body });
    }

    const payload = { data: first.json };

    // Filter out inferred/guessed emails: keep those with sources or explicitly verified
    try {
      if (payload?.data?.data?.emails && Array.isArray(payload.data.data.emails)) {
        payload.data.data.emails = payload.data.data.emails.filter((e) => {
          if (!e) return false;
          if (Array.isArray(e.sources) && e.sources.length > 0) return true;
          if (e.verification && e.verification.status === 'valid') return true;
          return false;
        });
      }
    } catch (e) {
      console.warn('filter error', e);
    }

    // cache short TTL if KV available
    try {
      if (typeof kv !== 'undefined') {
        await kv.set(cacheKey, payload, { ex: 60 * 30 });
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
