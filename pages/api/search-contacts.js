// Server-side: call Hunter domain-search and return provider payload under { data: ... }.
// Supports opt-in include_inferred (body.include_inferred) — honored only when client sends a session header.
// Saves a raw backup in KV before filtering so you can restore if needed.
import { getKV } from './_kv-wrapper';
const kv = getKV();

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
    const { domain, limit = 10, offset = '', include_inferred = false } = req.body || {};
    if (!domain) return res.status(400).json({ error: 'domain required in POST body' });

    const key = process.env.HUNTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'HUNTER_API_KEY not configured' });

    let requestedLimit = parseInt(limit, 10);
    if (isNaN(requestedLimit) || requestedLimit <= 0) requestedLimit = 10;
    requestedLimit = Math.min(requestedLimit, 100);

    const cacheKey = `hunter:search:${domain.toLowerCase()}:${requestedLimit}:${offset}`;

    // Try KV cache first
    try {
      if (kv) {
        const cached = await kv.get(cacheKey);
        if (cached) return res.status(200).json(cached);
      }
    } catch (e) {
      console.warn('KV read error', e?.message || e);
    }

    async function callHunter(limitToUse) {
      const url = makeHunterUrl(domain, limitToUse, offset);
      const r = await fetch(url);
      const text = await r.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        return { ok: false, status: r.status, body: text, json: null };
      }
      return { ok: r.ok, status: r.status, body: json, json };
    }

    const first = await callHunter(requestedLimit);

    if (!first.ok && first.body && first.body.errors && Array.isArray(first.body.errors)) {
      const paginationError = first.body.errors.find((err) => err?.id === 'pagination_error' || err?.code === 400);
      if (paginationError) {
        const fallback = await callHunter(10);
        if (!fallback.ok) {
          return res.status(502).json({ error: 'Upstream API error', status: fallback.status, body: fallback.body });
        }
        const payload = { data: fallback.json };
        try {
          if (kv) {
            await kv.set(`${cacheKey}:raw`, payload, { ex: 60 * 60 * 24 });
          }
        } catch (e) {
          console.warn('KV write raw backup error', e?.message || e);
        }

        const sessionHeader = req.headers['x-nh-session'];
        const allowInferred = include_inferred === true && !!sessionHeader;

        try {
          if (!allowInferred && payload?.data?.data?.emails && Array.isArray(payload.data.data.emails)) {
            const originalCount = payload.data.data.emails.length;
            payload.data.data.emails = payload.data.data.emails.filter((e) => {
              if (!e) return false;
              if (Array.isArray(e.sources) && e.sources.length > 0) return true;
              if (e.verification && e.verification.status === 'valid') return true;
              return false;
            });
            payload.data.meta = payload.data.meta || {};
            payload.data.meta.filtered_out = originalCount - payload.data.data.emails.length;
          }
        } catch (err) {
          console.warn('filter error', err?.message || err);
        }

        try {
          if (kv) {
            await kv.set(cacheKey, payload, { ex: 60 * 30 });
          }
        } catch (e) {
          console.warn('KV write error', e?.message || e);
        }

        return res.status(200).json(payload);
      }
    }

    if (!first.ok) {
      return res.status(502).json({ error: 'Upstream API error', status: first.status, body: first.body });
    }

    const payload = { data: first.json };

    try {
      if (kv) {
        await kv.set(`${cacheKey}:raw`, payload, { ex: 60 * 60 * 24 });
      }
    } catch (e) {
      console.warn('KV write raw backup error', e?.message || e);
    }

    const sessionHeader = req.headers['x-nh-session'];
    const allowInferred = include_inferred === true && !!sessionHeader;

    try {
      if (!allowInferred && payload?.data?.data?.emails && Array.isArray(payload.data.data.emails)) {
        const originalCount = payload.data.data.emails.length;
        payload.data.data.emails = payload.data.data.emails.filter((e) => {
          if (!e) return false;
          if (Array.isArray(e.sources) && e.sources.length > 0) return true;
          if (e.verification && e.verification.status === 'valid') return true;
          return false;
        });
        payload.data.meta = payload.data.meta || {};
        payload.data.meta.filtered_out = originalCount - payload.data.data.emails.length;
      }
    } catch (e) {
      console.warn('filter error', e?.message || e);
    }

    try {
      if (kv) {
        await kv.set(cacheKey, payload, { ex: 60 * 30 });
      }
    } catch (e) {
      console.warn('KV write error', e?.message || e);
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error('search-contacts error', err?.message || err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
