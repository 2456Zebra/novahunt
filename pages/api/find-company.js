// pages/api/find-company.js
// Robust handler: calls Hunter, maps data.emails -> contacts, OG + Wikipedia enrichment,
// returns hunter_raw for debugging, supports ?nocache=1 to bypass in-memory cache during testing.

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const cache = new Map();

function cacheKey(domain) { return `find:${domain}`; }

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function extractMeta(html) {
  const text = html || '';
  const ogDesc = text.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const ogImg = text.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const metaDesc = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  const ogTitle = text.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || text.match(/<title[^>]*>([^<]+)<\/title>/i);
  return {
    description: (ogDesc && ogDesc[1]) || (metaDesc && metaDesc[1]) || '',
    image: (ogImg && ogImg[1]) || '',
    title: (ogTitle && ogTitle[1]) || ''
  };
}

function clearbitLogo(domain) {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

async function fetchWikipediaSummary(query) {
  try {
    const sUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&origin=*&srsearch=${encodeURIComponent(query)}&srlimit=1`;
    const s = await fetchJson(sUrl);
    if (!s || !s.query || !s.query.search || s.query.search.length === 0) return null;
    const title = s.query.search[0].title;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const summary = await fetchJson(summaryUrl);
    if (!summary) return null;
    return {
      description: summary.extract || '',
      image: (summary && summary.thumbnail && summary.thumbnail.source) ? summary.thumbnail.source : null,
      url: summary && summary.content_urls && summary.content_urls.desktop ? summary.content_urls.desktop.page : null
    };
  } catch (e) {
    return null;
  }
}

function looksPromotional(text) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  const promo = ['shop', 'buy', 'order', 'subscribe', 'sale', 'shop all', 'buy now', 'offers', 'special offer'];
  for (const w of promo) if (t.includes(w)) return true;
  if (t.length < 80) return true;
  return false;
}

export default async function handler(req, res) {
  const domainQuery = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domainQuery) {
    res.status(400).json({ error: 'domain required' });
    return;
  }

  // allow bypassing cache during debugging
  const nocache = req.query.nocache === '1';

  const key = cacheKey(domainQuery);
  const now = Date.now();
  const cached = cache.get(key);
  if (!nocache && cached && (now - cached.ts) < CACHE_TTL_MS) {
    res.setHeader('x-cache', 'HIT');
    res.status(200).json(cached.val);
    return;
  }

  const out = {
    company: { name: domainQuery, domain: domainQuery, description: null, logo: null, enrichment: null },
    contacts: [],
    total: 0,
    shown: 0,
    hunter_raw: null
  };

  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || null;

  // Hunter call
  if (HUNTER_API_KEY) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domainQuery)}&limit=100&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
      const r = await fetch(hunterUrl);
      const text = await r.text().catch(() => null);
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
      out.hunter_raw = { status: r.status, ok: r.ok, json, text };

      const data = json && json.data ? json.data : null;
      if (data) {
        // total extraction
        let total = null;
        if (typeof data.total === 'number') total = data.total;
        if (total === null && data.metrics && typeof data.metrics.emails === 'number') total = data.metrics.emails;
        if (total === null && json && json.meta && typeof json.meta.results === 'number') total = json.meta.results;
        if (total === null && Array.isArray(data.emails)) total = data.emails.length;
        if (total !== null) out.total = total;

        // map emails -> contacts
        if (Array.isArray(data.emails) && data.emails.length) {
          out.contacts = data.emails.map(e => ({
            first_name: e.first_name || '',
            last_name: e.last_name || '',
            email: e.value || e.email || '',
            position: e.position || e.position_raw || '',
            score: e.confidence || null,
            department: e.department || '',
            linkedin: e.linkedin || null,
            sources: e.sources || null
          })).filter(c => c.email && c.email.indexOf('@') > -1);

          out.shown = out.contacts.length;
          if (!out.total || out.total === 0) out.total = out.shown;
        }

        if (data.organization) out.company.name = data.organization;
        if (data.domain) out.company.domain = data.domain;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = out.company.enrichment.source || 'hunter';
      }
    } catch (e) {
      console.warn('Hunter failed:', e && e.message);
    }
  }

  // OG/meta from homepage (for description and logo)
  try {
    const siteUrl = `https://${domainQuery}`;
    const r = await fetch(siteUrl, { redirect: 'follow' }).catch(() => null);
    if (r && r.ok) {
      const html = await r.text().catch(() => '');
      if (html) {
        const meta = extractMeta(html);
        if (meta.description) out.company.description = out.company.description || meta.description;
        if (meta.image) out.company.logo = out.company.logo || meta.image;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.url = siteUrl;
        out.company.enrichment.source = out.company.enrichment.source || 'og';
      }
    }
  } catch (e) {
    // ignore
  }

  // Wikipedia fallback for richer description
  try {
    const wikiQuery = out.company.name && out.company.name !== domainQuery ? out.company.name : domainQuery;
    const wiki = await fetchWikipediaSummary(wikiQuery);
    if (wiki) {
      const ogDesc = out.company.description || '';
      const wikiDesc = wiki.description || '';
      if (wikiDesc && (wikiDesc.length > Math.max(ogDesc.length, 120) || looksPromotional(ogDesc))) {
        out.company.description = wikiDesc;
        out.company.logo = out.company.logo || wiki.image;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = 'wikipedia';
        out.company.enrichment.url = out.company.enrichment.url || wiki.url;
      } else {
        out.company.description = out.company.description || wikiDesc;
        out.company.logo = out.company.logo || wiki.image;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = out.company.enrichment.source || 'wikipedia';
      }
    }
  } catch (e) { /* ignore */ }

  // clearbit fallback for logo
  if (!out.company.logo) out.company.logo = clearbitLogo(domainQuery);

  out.total = typeof out.total === 'number' ? out.total : (out.contacts && out.contacts.length) || 0;
  out.shown = typeof out.shown === 'number' ? out.shown : (out.contacts && out.contacts.length) || 0;

  // cache (unless nocache)
  if (!nocache) cache.set(key, { ts: now, val: out });

  res.setHeader('x-cache', nocache ? 'BYPASS' : 'MISS');
  // Default caching for debugging: allow Vercel to cache static assets but API returns a header
  res.status(200).json(out);
}
