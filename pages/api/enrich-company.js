// pages/api/enrich-company.js
// Enrichment pipeline with in-memory TTL cache
// Preference: Wikipedia -> Google Knowledge Graph (optional) -> OG/meta scraping
// Returns { domain, description, image, url, source }

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map();

function now() { return Date.now(); }

async function tryWikipedia(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
    const r = await fetch(searchUrl);
    if (!r.ok) return null;
    const j = await r.json();
    const hits = j && j.query && j.query.search ? j.query.search : [];
    if (!hits || hits.length === 0) return null;
    const title = hits[0].title;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const s = await fetch(summaryUrl);
    if (!s.ok) return null;
    const sj = await s.json();
    const description = sj.extract || sj.description || '';
    const image = sj.thumbnail && sj.thumbnail.source ? sj.thumbnail.source : null;
    const url = sj.content_urls && sj.content_urls.desktop && sj.content_urls.desktop.page ? sj.content_urls.desktop.page : null;
    if (description || image) {
      return { description, image, url, source: 'wikipedia' };
    }
  } catch (err) {
    // ignore
  }
  return null;
}

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'Missing domain query' });

  const cacheKey = `enrich:${domain}`;
  const cached = cache.get(cacheKey);
  if (cached && (now() - cached.ts) < CACHE_TTL_MS) {
    return res.status(200).json(cached.value);
  }

  // Build candidates to try on Wikipedia: inferred variations
  const domainParts = domain.split('.');
  const base = domainParts.slice(0, domainParts.length - 1).join(' ');
  const inferredName = base.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const alt1 = domain.split('.')[0].replace(/-/g, ' '); // coca-cola
  const alt2 = domain.replace(/\.(com|net|org|co|io|ai)$/, '').replace(/-/g, ' ');

  const wikiCandidates = [inferredName, alt1, alt2];

  for (const q of wikiCandidates) {
    if (!q || q.trim().length < 2) continue;
    const w = await tryWikipedia(q);
    if (w) {
      cache.set(cacheKey, { ts: now(), value: { domain, ...w } });
      return res.status(200).json({ domain, ...w });
    }
  }

  // Google Knowledge Graph fallback (if key present)
  const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_KG_KEY;
  if (GOOGLE_KEY) {
    try {
      const q = encodeURIComponent(domain);
      const kgUrl = `https://kgsearch.googleapis.com/v1/entities:search?query=${q}&limit=1&indent=false&key=${GOOGLE_KEY}`;
      const r = await fetch(kgUrl);
      if (r.ok) {
        const j = await r.json();
        const item = j && j.itemListElement && j.itemListElement[0] && j.itemListElement[0].result;
        if (item) {
          const desc = (item.detailedDescription && (item.detailedDescription.articleBody || item.detailedDescription.articleBody)) || item.description || item.name || '';
          const image = item.image && (item.image.contentUrl || item.image.url) ? (item.image.contentUrl || item.image.url) : null;
          const url = item.url || null;
          const out = { domain, description: desc || '', image: image || null, url, source: 'kg' };
          cache.set(cacheKey, { ts: now(), value: out });
          return res.status(200).json(out);
        }
      }
    } catch (err) {
      console.error('KG error', err);
    }
  }

  // Final fallback: OG/meta scraping
  const urlsToTry = [
    `https://${domain}`,
    `https://www.${domain}`,
    `http://${domain}`,
    `http://www.${domain}`
  ];

  let html = null;
  let finalUrl = null;

  for (const u of urlsToTry) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaHunt/1.0)' }, redirect: 'follow' });
      if (r.ok) {
        html = await r.text();
        finalUrl = r.url || u;
        break;
      }
    } catch (err) {
      // try next
    }
  }

  function extractMeta(htmlText, nameCandidates) {
    if (!htmlText) return '';
    for (const name of nameCandidates) {
      const re = new RegExp(`<meta[^>]+(?:property|name)=(?:'|")${name}(?:'|")[^>]*content=(?:'|")([^'"]+)(?:'|")`, 'i');
      const m = re.exec(htmlText);
      if (m && m[1]) return m[1].trim();
    }
    return '';
  }

  if (html) {
    const ogDescription = extractMeta(html, ['og:description','description','twitter:description']);
    const ogTitle = extractMeta(html, ['og:title','twitter:title','title']);
    const ogImage = extractMeta(html, ['og:image','twitter:image','image']);
    const faviconMatch = /<link[^>]+rel=(?:'|")icon(?:'|")[^>]*href=(?:'|")([^'"]+)(?:'|")/i.exec(html);
    const favicon = faviconMatch ? faviconMatch[1] : null;

    function normalizeUrl(src) {
      if (!src) return null;
      try {
        const u = new URL(src, finalUrl || `https://${domain}`);
        return u.toString();
      } catch {
        return null;
      }
    }

    const description = ogDescription || ogTitle || '';
    const image = normalizeUrl(ogImage) || normalizeUrl(favicon) || null;

    const out = { domain, description, image, url: finalUrl || `https://${domain}`, source: 'og' };
    cache.set(cacheKey, { ts: now(), value: out });
    if (description || image) return res.status(200).json(out);
  }

  // nothing found
  const empty = { domain, description: '', image: null, url: null, source: 'none' };
  cache.set(cacheKey, { ts: now(), value: empty });
  return res.status(200).json(empty);
}
