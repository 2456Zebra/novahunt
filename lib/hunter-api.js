// lib/hunter-api.js — Shared Hunter API utilities and logic
const HUNTER_API_KEY = process.env.HUNTER_API_KEY || '';
const HUNTER_PAGE_SIZE = Number(process.env.HUNTER_PAGE_SIZE || 100);
const HUNTER_MAX_COLLECT = Number(process.env.HUNTER_MAX_COLLECT || 5000);

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a single page from Hunter API
 * @param {string} domain - Domain to search
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Items per page
 * @returns {Promise<{status: number, json: object, bodyText: string}>}
 */
async function fetchHunterPage(domain, page, perPage) {
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(HUNTER_API_KEY)}&limit=${perPage}&offset=${(page - 1) * perPage}`;
  
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text().catch(() => '');
  
  let json = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { raw: text };
  }
  
  return { status: res.status, json, bodyText: text };
}

/**
 * Normalize Hunter API email items to standard format
 * @param {Array} emails - Raw email objects from Hunter API
 * @returns {Array} - Normalized email objects
 */
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

/**
 * Perform full Hunter domain search with paging and retry logic
 * @param {string} domain - Domain to search
 * @param {object} options - Options
 * @param {Function} options.progressCallback - Optional callback for progress updates
 * @param {boolean} options.enableCache - Whether to use caching (default: false)
 * @param {Function} options.cacheGet - Cache getter function
 * @param {Function} options.cacheSet - Cache setter function
 * @returns {Promise<{items: Array, total: number}>}
 */
async function callHunterDomainSearch(domain, options = {}) {
  const { progressCallback, enableCache = false, cacheGet, cacheSet } = options;

  // Check cache if enabled
  if (enableCache && cacheGet) {
    const cached = cacheGet(`hunter_full:${domain}`);
    if (cached) return cached;
  }

  if (!HUNTER_API_KEY) {
    const err = new Error('HUNTER_API_KEY missing in environment');
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

    // Handle rate limiting with exponential backoff
    if (status === 429) {
      consecutive429s += 1;
      const backoffMs = Math.min(1000 * Math.pow(2, consecutive429s), 30000); // cap at 30s
      console.warn(`Hunter rate limited (429), backing off ${backoffMs}ms for domain=${domain} page=${page}`);
      
      if (progressCallback) {
        progressCallback({
          status: 'rate_limited',
          page,
          backoffMs,
          collected: allEmailsRaw.length
        });
      }
      
      await sleep(backoffMs);
      continue;
    }

    if (!json) {
      console.error('Hunter unexpected non-json response', { 
        domain, 
        page, 
        status, 
        preview: (bodyText || '').slice(0, 400) 
      });
      break;
    }

    // Extract total on first page
    if (hunterTotal === null) {
      hunterTotal = (json && json.data && (json.data.total || (json.data.meta && json.data.meta.total))) || null;
    }

    const emails = (json && json.data && json.data.emails) ? json.data.emails : [];
    if (!emails || emails.length === 0) {
      break;
    }

    allEmailsRaw = allEmailsRaw.concat(emails);

    // Report progress
    if (progressCallback) {
      const progress = hunterTotal > 0 ? Math.floor((allEmailsRaw.length / hunterTotal) * 100) : 0;
      progressCallback({
        status: 'fetching',
        page,
        collected: allEmailsRaw.length,
        total: hunterTotal,
        progress
      });
    }

    // Stop if collected enough items
    if (hunterTotal && allEmailsRaw.length >= hunterTotal) break;
    if (allEmailsRaw.length >= maxCollect) {
      console.warn('Reached HUNTER_MAX_COLLECT safety cap', { 
        domain, 
        collected: allEmailsRaw.length, 
        cap: maxCollect 
      });
      break;
    }

    page += 1;
    consecutive429s = 0; // reset backoff counter after successful page
    await sleep(150); // small delay between pages
  }

  // Normalize and dedupe by email (case-insensitive)
  const normalized = normalizeHunterItemsFromEmails(allEmailsRaw);
  const map = new Map();
  normalized.forEach(it => {
    if (it.email) map.set(it.email.toLowerCase(), it);
  });
  const uniqueItems = Array.from(map.values());

  const result = { 
    items: uniqueItems, 
    total: Number.isFinite(hunterTotal) ? hunterTotal : uniqueItems.length 
  };

  // Cache result if enabled
  if (enableCache && cacheSet) {
    try { cacheSet(`hunter_full:${domain}`, result); } catch (e) {}
  }

  return result;
}

module.exports = {
  fetchHunterPage,
  normalizeHunterItemsFromEmails,
  callHunterDomainSearch,
  sleep
};
