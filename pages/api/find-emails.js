// pages/api/find-emails.js
// Robust synchronous paging: fetch multiple pages from Hunter until we've collected hunterTotal
// or reached a safety cap. Includes exponential backoff handling for 429s and simple in-memory caching.

const { getUserBySession } = require('../../lib/session');
const { incrementUsage, getUsageForUser } = require('../../lib/user-store');

const HUNTER_KEY = process.env.HUNTER_API_KEY || '';
const HUNTER_PAGE_SIZE = Number(process.env.HUNTER_PAGE_SIZE || 100); // per-page request size
const HUNTER_MAX_COLLECT = Number(process.env.HUNTER_MAX_COLLECT || 5000); // safety cap
const CACHE_TTL_MS = Number(process.env.FIND_EMAILS_CACHE_TTL_MS || 1000 * 60 * 5); // default 5m

const CACHE = new Map();

function cacheSet(key, value) {
  try {
    CACHE.set(key, { value, t: Date.now() });
  } catch (e) {}
}
function cacheGet(key) {
  const rec = CACHE.get(key);
  if (!rec) return null;
  if (Date.now() - rec.t > CACHE_TTL_MS) { CACHE.delete(key); return null; }
  return rec.value;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHunterPage(domain, page, perPage) {
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(HUNTER_KEY)}&limit=${perPage}&page=${page}`;
  const res = await global.fetch(url, { method: 'GET' });
  const text = await res.text().catch(() => '');
  let json = null;
  try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }
  return { status: res.status, json, bodyText: text };
}

function normalizeHunterItemsFromEmails(emails) {
  try {
    return (emails || []).map(e => ({
      email: e.value,
      name: [e.first_name, e.last_name].filter(Boolean).join(' ') || '',
      title: e.position || '',
      confidence: (typeof e.confidence === 'number') ? (e.confidence / 100) : (e.score ? e.score : 0),
      source: (e.sources && e.sources[0] && e.sources[0].uri) ? e.sources[0].uri : ''
    }));
  } catch (e) {
    return [];
  }
}

async function callHunterDomainSearch(domain) {
  // Return cached if present
  const cacheKey = `hunter_full:${domain}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  if (!HUNTER_KEY) {
    const err = new Error('HUNTER_API_KEY missing in env');
    err.hunter = { status: 500, url: null, body: 'HUNTER_API_KEY missing' };
    throw err;
  }

  let page = 1;
  const perPage = Math.min(500, Math.max(10, HUNTER_PAGE_SIZE));
  const maxCollect = Math.max(100, Math.min(20000, HUNTER_MAX_COLLECT));
  let allEmailsRaw = [];
  let hunterTotal = null;
  let consecutive429s = 0;

  while (true) {
    const { status, json, bodyText } = await (async () => {
      try {
        const res = await fetchHunterPage(domain, page, perPage);
        return { status: res.status, json: res.json, bodyText: res.bodyText };
      } catch (err) {
        return { status: 500, json: null, bodyText: String(err?.message || err) };
      }
    })();

    if (status === 429) {
      // Rate limited: exponential backoff
      consecutive429s += 1;
      const backoffMs = Math.min(1000 * Math.pow(2, consecutive429s), 30000); // cap 30s
      console.warn(`hunter rate limited, backing off ${backoffMs}ms for domain=${domain} page=${page}`);
      await sleep(backoffMs);
      continue;
    }

    // If Hunter returns a non-OK HTTP status (except 429), treat as an error and surface
    if (status >= 400) {
      const err = new Error(`Hunter API returned HTTP ${status}`);
      err.hunter = { status, url: `domain=${domain}&page=${page}&limit=${perPage}`, body: bodyText || json || '' };
      // Log preview for easier debugging
      console.error('hunter http error', { domain, page, status, preview: String(bodyText || '').slice(0, 1000) });
      throw err;
    }

    if (!json) {
      console.error('hunter unexpected non-json response', { domain, page, status, preview: (bodyText || '').slice(0, 400) });
      break;
    }

    if (hunterTotal === null) {
      hunterTotal = (json && json.data && (json.data.total || (json.data.meta && json.data.meta.total))) || null;
    }

    const emails = (json && json.data && json.data.emails) ? json.data.emails : [];
    // If the response is valid but contains no emails, break (no further pages)
    if (!emails || emails.length === 0) {
      // If hunterTotal exists and is >0 but response has no emails, log preview for diagnosis
      if (hunterTotal && hunterTotal > 0) {
        console.info('hunter reported total > 0 but this page returned 0 emails', { domain, page, hunterTotal, preview: (bodyText || '').slice(0, 400) });
      }
      break;
    }

    allEmailsRaw = allEmailsRaw.concat(emails);

    // stop if collected enough items
    if (hunterTotal && allEmailsRaw.length >= hunterTotal) break;
    if (allEmailsRaw.length >= maxCollect) {
      console.warn('Reached HUNTER_MAX_COLLECT safety cap', { domain, collected: allEmailsRaw.length, cap: maxCollect });
      break;
    }

    page += 1;
    consecutive429s = 0; // reset backoff counter after a successful page
    await sleep(150); // small delay between pages
  }

  // Normalize and dedupe by email (case-insensitive)
  const normalized = normalizeHunterItemsFromEmails(allEmailsRaw);
  const map = new Map();
  normalized.forEach(it => {
    if (it.email) map.set(it.email.toLowerCase(), it);
  });
  const uniqueItems = Array.from(map.values());

  const result = { items: uniqueItems, total: Number.isFinite(hunterTotal) ? hunterTotal : uniqueItems.length };

  // Cache result briefly
  try { cacheSet(cacheKey, result); } catch (e) {}

  return result;
}

function extractSessionToken(req) {
  const header = req.headers && (req.headers['x-nh-session'] || req.headers['x-nh-session'.toLowerCase()]);
  if (header) return (typeof header === 'string') ? header : String(header);
  const cookie = req.headers && req.headers.cookie ? req.headers.cookie : '';
  const m = cookie.match(/nh_session=([^;]+)/);
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  const domain = String((req.query && req.query.domain) || '').trim();
  if (!domain) return res.status(400).json({ ok: false, error: 'Missing domain' });

  const session = extractSessionToken(req);
  const cacheKey = `hunter_full:${domain}`;
  const cached = cacheGet(cacheKey);

  // If cached, return cached (and include usage if user authenticated)
  if (cached) {
    try {
      if (session) {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          const usageBefore = await getUsageForUser(payload.sub);
          const searchesUsed = usageBefore.searchesUsed || 0;
          const searchesTotal = usageBefore.searchesTotal || 0;
          if (searchesTotal > 0 && searchesUsed >= searchesTotal) {
            return res.status(402).json({ ok: false, error: 'Search quota exceeded' });
          }
          await incrementUsage(payload.sub, { searches: 1 });
          const usage = await getUsageForUser(payload.sub);
          return res.status(200).json({ ok: true, items: cached.items, total: cached.total, usage });
        }
      }
    } catch (e) { /* ignore usage increment failures */ }
    return res.status(200).json({ ok: true, items: cached.items, total: cached.total });
  }

  if (!HUNTER_KEY) {
    console.error('find-emails: HUNTER_API_KEY missing in environment (Production must have HUNTER_API_KEY).');
    return res.status(500).json({ ok: false, error: 'HUNTER_API_KEY missing in env' });
  }

  try {
    // quota pre-check for authenticated users
    if (session) {
      try {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          const usageBefore = await getUsageForUser(payload.sub);
          const searchesUsed = usageBefore.searchesUsed || 0;
          const searchesTotal = usageBefore.searchesTotal || 0;
          if (searchesTotal > 0 && searchesUsed >= searchesTotal) {
            return res.status(402).json({ ok: false, error: 'Search quota exceeded' });
          }
        }
      } catch (e) {
        console.error('find-emails usage check failed', e && (e.message || e));
      }
    }

    // Fetch full (paged) results from Hunter
    const result = await callHunterDomainSearch(domain);

    // server-side info log to inspect counts in Vercel logs
    try {
      console.info('find-emails success', { domain, normalizedItems: result.items.length, hunterTotal: result.total });
    } catch (e) {}

    cacheSet(cacheKey, result);

    if (session) {
      try {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          const usage = await incrementUsage(payload.sub, { searches: 1 });
          return res.status(200).json({ ok: true, items: result.items, total: result.total, usage });
        }
      } catch (e) {
        console.error('find-emails increment usage error', e && (e.message || e));
        return res.status(200).json({ ok: true, items: result.items, total: result.total });
      }
    }

    return res.status(200).json({ ok: true, items: result.items, total: result.total });
  } catch (err) {
    if (err && err.hunter) {
      console.error('find-emails hunter error:', {
        message: err.message,
        hunterStatus: err.hunter.status,
        hunterUrl: err.hunter.url,
        hunterBodyPreview: String(err.hunter.body || '').slice(0, 200)
      });
      // Surface a clearer message to the client about hunter HTTP failures
      return res.status(502).json({ ok: false, error: 'Hunter API error', hunterStatus: err.hunter.status, hunterPreview: String(err.hunter.body || '').slice(0, 400) });
    } else {
      console.error('find-emails hunter error', err && (err.message || err));
    }
    return res.status(500).json({ ok: false, error: 'Hunter lookup failed' });
  }
}
