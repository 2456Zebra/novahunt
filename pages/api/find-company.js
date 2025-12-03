// Serverless /api/find-company (enhanced description selection + robust Hunter mapping)
// - Integrates Hunter domain-search when HUNTER_API_KEY is provided (limit=100).
// - Scrapes OpenGraph/meta from the homepage for description/logo.
// - Uses Wikipedia summary as a high-quality free fallback and will prefer it when richer.
// - Uses Clearbit logo as a last-resort free fallback.
// - Simple in-memory cache (12h). For production use a persistent cache.

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const cache = new Map();

function cacheKey(domain) {
  return `find:${domain}`;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function extractMeta(html) {
  try {
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
  } catch (e) {
    return { description: '', image: '', title: '' };
  }
}

function clearbitLogo(domain) {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

async function fetchWikipediaHint(query) {
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
      source: 'wikipedia',
      url: summary.content_urls && summary.content_urls.desktop && summary.content_urls.desktop.page ? summary.content_urls.desktop.page : null
    };
  } catch (e) {
    return null;
  }
}

function looksPromotional(text) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  const promoWords = ['shop', 'buy', 'order', 'subscribe', 'limited time', 'sale', 'store', 'shop all', 'buy now', 'offers', 'special offer'];
  for (const w of promoWords) {
    if (t.includes(w)) return true;
  }
  // extremely short descriptions are likely promotional meta or insufficient
  if (t.length < 80) return true;
  return false;
}

export default async function handler(req, res) {
  const domainReq = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domainReq) {
    res.status(400).json({ error: 'domain required' });
    return;
  }

  const key = cacheKey(domainReq);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && (now - cached.ts) < CACHE_TTL_MS) {
    res.setHeader('x-cache', 'HIT');
    res.status(200).json(cached.val);
    return;
  }

  const out = {
    company: { name: domainReq, domain: domainReq, description: null, logo: null, enrichment: null },
    contacts: [],
    total: null,
    shown: 0
  };

  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || null;

  // 1) Hunter integration (if key present)
  if (HUNTER_API_KEY) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domainReq)}&limit=100&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
      const hunter = await fetchJson(hunterUrl);
      const data = hunter && hunter.data ? hunter.data : null;

      if (data) {
        // Extract authoritative total from multiple possible fields
        let total = null;
        if (typeof data.total === 'number') total = data.total;
        if (total === null && data.metrics && typeof data.metrics.emails === 'number') total = data.metrics.emails;
        if (total === null && hunter && hunter.meta && typeof hunter.meta.total === 'number') total = hunter.meta.total;
        if (total === null && Array.isArray(data.emails) && data.emails.length) total = data.emails.length;

        if (total !== null) out.total = total;

        // Map Hunter emails defensively
        if (Array.isArray(data.emails) && data.emails.length > 0) {
          out.contacts = data.emails.map((e) => ({
            first_name: e.first_name || '',
            last_name: e.last_name || '',
            email: e.value || e.email || '',
            position: e.position || e.title || '',
            score: e.confidence || e.score || null,
            department: e.department || '',
          })).filter(c => c.email && c.email.indexOf('@') > -1);

          out.shown = out.contacts.length;
          if (out.total === null) out.total = out.shown;
        }

        // organization / domain normalization
        if (data.organization) out.company.name = data.organization;
        if (data.domain) out.company.domain = data.domain;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = 'hunter';
        out.company.enrichment.raw = hunter; // include raw for debugging if needed
      }
    } catch (e) {
      console.warn('Hunter integration failed:', e && e.message);
      // continue to OG/Wikipedia fallback
    }
  }

  // 2) Fetch company homepage OG/meta
  try {
    const siteUrl = `https://${domainReq}`;
    const r = await fetch(siteUrl, { redirect: 'follow' }).catch(() => null);
    if (r && r.ok) {
      const html = await r.text().catch(() => '');
      if (html) {
        const meta = extractMeta(html);
        if (meta.description) out.company.description = (out.company.description || '') || meta.description;
        if (meta.image) out.company.logo = out.company.logo || meta.image;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.url = siteUrl;
        out.company.enrichment.source = out.company.enrichment.source || 'og';
      }
    }
  } catch (e) {
    // ignore
  }

  // 3) Wikipedia fallback (prefer if richer / less promotional)
  try {
    const wikiQuery = out.company.name && out.company.name !== domainReq ? out.company.name : domainReq;
    const wiki = await fetchWikipediaHint(wikiQuery);
    if (wiki) {
      // Prefer Wikipedia description if it's substantially longer or OG looked promotional
      const ogDesc = out.company.description || '';
      const wikiDesc = wiki.description || '';
      if (wikiDesc && (wikiDesc.length > Math.max(ogDesc.length, 120) || looksPromotional(ogDesc))) {
        out.company.description = wikiDesc;
        out.company.logo = out.company.logo || wiki.image;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = 'wikipedia';
        out.company.enrichment.url = out.company.enrichment.url || wiki.url;
      } else {
        // if OG was okay, keep it; else use wiki if available
        out.company.description = out.company.description || wiki.description;
        out.company.logo = out.company.logo || wiki.image;
        out.company.enrichment = out.company.enrichment || {};
        out.company.enrichment.source = out.company.enrichment.source || 'wikipedia';
      }
    }
  } catch (e) {
    // ignore
  }

  // 4) Clearbit logo fallback
  if (!out.company.logo) out.company.logo = clearbitLogo(domainReq);

  // 5) Ensure numeric totals
  out.total = (typeof out.total === 'number') ? out.total : (out.contacts && out.contacts.length) || 0;
  out.shown = (typeof out.shown === 'number') ? out.shown : (out.contacts && out.contacts.length) || 0;

  // Cache and return
  cache.set(key, { ts: now, val: out });
  res.setHeader('x-cache', 'MISS');
  res.status(200).json(out);
}
