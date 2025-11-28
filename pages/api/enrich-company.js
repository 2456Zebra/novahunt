// pages/api/enrich-company.js
// Enrichment: try OG/title to derive a good query, then Wikipedia (preferred), then KG, then OG/meta scraping.
// 10 minute in-memory cache to reduce calls.

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();
function now() { return Date.now(); }

async function fetchRootHtml(domain) {
  const urls = [`https://${domain}`, `https://www.${domain}`, `http://${domain}`, `http://www.${domain}`];
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaHunt/1.0)' }, redirect:'follow' });
      if (r.ok) {
        const text = await r.text();
        return { html: text, url: r.url || u };
      }
    } catch (e) {
      // ignore and try next
    }
  }
  return null;
}

function extractMetaField(html, names) {
  if (!html) return '';
  for (const n of names) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=['"]${n}['"][^>]*content=['"]([^'"]+)['"]`, 'i');
    const m = re.exec(html);
    if (m && m[1]) return m[1].trim();
  }
  // try <title>
  if (names.includes('og:title') || names.includes('title')) {
    const t = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    if (t && t[1]) return t[1].trim();
  }
  return '';
}

async function tryWikipedia(query) {
  if (!query || query.trim().length < 2) return null;
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
    if (description || image) return { description, image, url, source: 'wikipedia' };
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

  // 1) quick fetch root HTML to get og:title/title for a good wiki query
  const root = await fetchRootHtml(domain);
  let ogTitle = '';
  if (root && root.html) {
    ogTitle = extractMetaField(root.html, ['og:title', 'twitter:title', 'title']);
  }

  // Try Wikipedia using ogTitle, then inferred names
  if (ogTitle) {
    const w = await tryWikipedia(ogTitle);
    if (w) { cache.set(cacheKey, { ts: now(), value: { domain, ...w } }); return res.status(200).json({ domain, ...w }); }
  }

  // If ogTitle failed, try multiple inferred queries
  const parts = domain.split('.');
  const base = parts.slice(0, parts.length - 1).join(' ');
  const inferredName = base.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const alt1 = parts[0].replace(/-/g, ' ');
  const alt2 = domain.replace(/\.(com|net|org|co|io|ai)$/, '').replace(/-/g, ' ');
  const candidates = [inferredName, alt1, alt2];

  for (const q of candidates) {
    const w = await tryWikipedia(q);
    if (w) { cache.set(cacheKey, { ts: now(), value: { domain, ...w } }); return res.status(200).json({ domain, ...w }); }
  }

  // Google KG fallback
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

  // OG/meta fallback using root fetch data
  if (root && root.html) {
    const ogDescription = extractMetaField(root.html, ['og:description','description','twitter:description']);
    const ogImage = extractMetaField(root.html, ['og:image','twitter:image','image']);
    function normalize(src) {
      if (!src) return null;
      try {
        const u = new URL(src, root.url || `https://${domain}`);
        return u.toString();
      } catch { return null; }
    }
    const out = { domain, description: ogDescription || '', image: normalize(ogImage) || null, url: root.url || null, source: 'og' };
    cache.set(cacheKey, { ts: now(), value: out });
    if (out.description || out.image) return res.status(200).json(out);
  }

  const empty = { domain, description:'', image:null, url:null, source:'none' };
  cache.set(cacheKey, { ts: now(), value: empty });
  return res.status(200).json(empty);
}
