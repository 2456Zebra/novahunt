// pages/api/find-emails.js
// Fast-first-page Hunter domain-search handler with paging cap and masking for public responses.

const { getUserBySession } = require('../../lib/session');
const { incrementUsage, getUsageForUser } = require('../../lib/user-store');

const HUNTER_KEY = process.env.HUNTER_API_KEY || '';
const HUNTER_PAGE_SIZE = Number(process.env.HUNTER_PAGE_SIZE || 50); // reasonable default
const HUNTER_MAX_PAGES = Number(process.env.HUNTER_MAX_PAGES || 1); // default: return first page for responsiveness
const HUNTER_MAX_COLLECT = Number(process.env.HUNTER_MAX_COLLECT || 5000);
const CACHE_TTL_MS = Number(process.env.FIND_EMAILS_CACHE_TTL_MS || 1000 * 60 * 5);

const CACHE = new Map();

function cacheSet(key, value) {
  try { CACHE.set(key, { value, t: Date.now() }); } catch (e) {}
}
function cacheGet(key) {
  const rec = CACHE.get(key);
  if (!rec) return null;
  if (Date.now() - rec.t > CACHE_TTL_MS) { CACHE.delete(key); return null; }
  return rec.value;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

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
      department: e.department || '',
      confidence: (typeof e.confidence === 'number') ? (e.confidence / 100) : (e.score ? e.score : 0),
      source: (e.sources && e.sources[0] && e.sources[0].uri) ? e.sources[0].uri : ''
    }));
  } catch (e) {
    return [];
  }
}

async function callHunterDomainSearch(domain) {
  const cacheKey = `hunter_full:${domain}:p${HUNTER_MAX_PAGES}:${HUNTER_PAGE_SIZE}`;
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
  const maxPages = Math.max(1, Math.min(50, HUNTER_MAX_PAGES));
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
      consecutive429s += 1;
      const backoffMs = Math.min(1000 * Math.pow(2, consecutive429s), 30000);
      await sleep(backoffMs);
      continue;
    }

    if (status === 400) {
      const errors = (json && json.errors) ? json.errors : null;
      const isPaginationError = Array.isArray(errors) && errors.some(e => {
        if (!e) return false;
        const id = String(e.id || '').toLowerCase();
        const details = String(e.details || '').toLowerCase();
        return id.includes('pagination') || details.includes('limited') || details.includes('limit');
      });

      if (isPaginationError) {
        // Try small page size once
        try {
          const smallRes = await fetchHunterPage(domain, page, Math.min(10, perPage));
          if (smallRes.status === 200 && smallRes.json) {
            const sEmails = (smallRes.json && smallRes.json.data && smallRes.json.data.emails) ? smallRes.json.data.emails : [];
            if (hunterTotal === null) {
              hunterTotal = (smallRes.json && smallRes.json.data && (smallRes.json.data.total || (smallRes.json.data.meta && smallRes.json.data.meta.total))) || null;
            }
            allEmailsRaw = allEmailsRaw.concat(sEmails);
          }
        } catch (e) {}
        break;
      }

      const err = new Error(`Hunter API returned HTTP ${status}`);
      err.hunter = { status, url: `domain=${domain}&page=${page}&limit=${perPage}`, body: bodyText || json || '' };
      throw err;
    }

    if (status >= 400) {
      const err = new Error(`Hunter API returned HTTP ${status}`);
      err.hunter = { status, url: `domain=${domain}&page=${page}&limit=${perPage}`, body: bodyText || json || '' };
      throw err;
    }

    if (!json) break;

    if (hunterTotal === null) {
      hunterTotal = (json && json.data && (json.data.total || (json.data.meta && json.data.meta.total))) || null;
    }

    const emails = (json && json.data && json.data.emails) ? json.data.emails : [];
    if (!emails || emails.length === 0) break;
    allEmailsRaw = allEmailsRaw.concat(emails);

    // Respect the quick-response pages cap
    if (page >= maxPages) break;

    if (hunterTotal && allEmailsRaw.length >= hunterTotal) break;
    if (allEmailsRaw.length >= maxCollect) break;

    page += 1;
    consecutive429s = 0;
    await sleep(150);
  }

  const normalized = normalizeHunterItemsFromEmails(allEmailsRaw);
  const map = new Map();
  normalized.forEach(it => { if (it.email) map.set(it.email.toLowerCase(), it); });
  const uniqueItems = Array.from(map.values());

  const result = { items: uniqueItems, total: Number.isFinite(hunterTotal) ? hunterTotal : uniqueItems.length };
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

function maskEmailAddr(email) {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `* @${domain}`;
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${'*'.repeat(Math.max(3, local.length - 2))}${last}@${domain}`;
}

function maskResultForPublic(resultObj, session) {
  if (!resultObj || !Array.isArray(resultObj.items)) return resultObj;
  if (!session) {
    const maskedItems = resultObj.items.map(it => {
      const masked = Object.assign({}, it);
      masked.maskedEmail = maskEmailAddr(it.email || '');
      delete masked.email;
      return masked;
    });
    return { items: maskedItems, total: resultObj.total, public: true, canReveal: false, revealUrl: '/plans?source=search' };
  } else {
    return { items: resultObj.items, total: resultObj.total, public: false, canReveal: true };
  }
}

export default async function handler(req, res) {
  const domain = String((req.query && req.query.domain) || '').trim();
  if (!domain) return res.status(400).json({ ok: false, error: 'Missing domain' });

  const session = extractSessionToken(req);
  const cacheKey = `hunter_full:${domain}:p${HUNTER_MAX_PAGES}:${HUNTER_PAGE_SIZE}`;
  const cached = cacheGet(cacheKey);

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
          const publicResult = maskResultForPublic(cached, session);
          return res.status(200).json(Object.assign({ ok: true }, publicResult, { usage }));
        }
      }
    } catch (e) {}
    const publicResult = maskResultForPublic(cached, session);
    return res.status(200).json(Object.assign({ ok: true }, publicResult));
  }

  if (!HUNTER_KEY) {
    console.error('find-emails: HUNTER_API_KEY missing in environment.');
    return res.status(500).json({ ok: false, error: 'HUNTER_API_KEY missing in env' });
  }

  try {
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
      } catch (e) {}
    }

    const result = await callHunterDomainSearch(domain);
    cacheSet(cacheKey, result);

    if (session) {
      try {
        const payload = getUserBySession(session);
        if (payload && payload.sub) {
          const usage = await incrementUsage(payload.sub, { searches: 1 });
          const publicResult = maskResultForPublic(result, session);
          return res.status(200).json(Object.assign({ ok: true }, publicResult, { usage }));
        }
      } catch (e) {
        const publicResult = maskResultForPublic(result, session);
        return res.status(200).json(Object.assign({ ok: true }, publicResult));
      }
    }

    const publicResult = maskResultForPublic(result, session);
    return res.status(200).json(Object.assign({ ok: true }, publicResult));
  } catch (err) {
    if (err && err.hunter) {
      console.error('find-emails hunter error:', {
        message: err.message,
        hunterStatus: err.hunter.status,
        hunterUrl: err.hunter.url,
        hunterBodyPreview: String(err.hunter.body || '').slice(0, 200)
      });
      return res.status(502).json({ ok: false, error: 'Hunter API error', hunterStatus: err.hunter.status, hunterPreview: String(err.hunter.body || '').slice(0, 400) });
    } else {
      console.error('find-emails error', err && (err.message || err));
    }
    return res.status(500).json({ ok: false, error: 'Hunter lookup failed' });
  }
}
