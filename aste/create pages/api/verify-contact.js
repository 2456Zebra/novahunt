// Neutral verify endpoint (server-side).
// - Calls the email-verifier endpoint server-side.
// - Uses Vercel KV to cache verification results and enforce a reveal quota per user or IP.
// - WARNING: each verify call consumes credits from the provider account.
import { kv } from '@vercel/kv';

function getClientId(req) {
  // Try authenticated user id if present (e.g., from a cookie header), otherwise fallback to IP
  // If you add authentication later, return user id here
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'anon';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required in POST body' });

    const key = process.env.HUNTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'API key not configured' });

    // Basic email format check
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({ error: 'invalid email format' });
    }

    const cacheKey = `verify:${email.toLowerCase()}`;
    try {
      if (typeof kv !== 'undefined') {
        const cached = await kv.get(cacheKey);
        if (cached) {
          return res.status(200).json({ data: cached, cached: true });
        }
      }
    } catch (e) {
      console.warn('KV read error', e);
    }

    // Reveal quota (per client id). Default free reveals per client
    const clientId = getClientId(req);
    const quotaKey = `quota:${clientId}`;
    let remaining = null;
    try {
      if (typeof kv !== 'undefined') {
        const q = await kv.get(quotaKey);
        remaining = typeof q === 'number' ? q : null;
      }
    } catch (e) {
      console.warn('KV read error for quota', e);
    }

    // If no quota present, initialize a small free quota (e.g., 3 reveals)
    if (remaining === null) {
      try {
        if (typeof kv !== 'undefined') {
          await kv.set(quotaKey, 3, { ex: 24 * 60 * 60 }); // 24 hours
          remaining = 3;
        }
      } catch (e) {
        console.warn('KV set quota error', e);
      }
    }

    if (typeof remaining === 'number' && remaining <= 0) {
      return res.status(429).json({ error: 'Reveal quota exceeded. Please upgrade or try later.' });
    }

    // Call provider verify endpoint
    const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${encodeURIComponent(key)}`;

    const r = await fetch(url);
    const text = await r.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      return res.status(502).json({ error: 'Upstream returned non-JSON', status: r.status, body: text });
    }

    if (!r.ok) {
      return res.status(502).json({ error: 'Upstream API error', status: r.status, body: json });
    }

    // Store verification result in KV for a reasonable TTL (e.g., 30 days)
    try {
      if (typeof kv !== 'undefined') {
        await kv.set(cacheKey, json, { ex: 30 * 24 * 60 * 60 });
        // Decrement quota
        if (typeof kv !== 'undefined' && remaining !== null) {
          await kv.set(quotaKey, Math.max(0, remaining - 1), { ex: 24 * 60 * 60 });
        }
      }
    } catch (e) {
      console.warn('KV write error', e);
    }

    return res.status(200).json({ data: json });
  } catch (err) {
    console.error('verify-contact error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
