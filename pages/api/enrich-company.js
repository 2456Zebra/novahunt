// pages/api/enrich-company.js
// Enrichment: try Wikipedia first (free), then Google Knowledge Graph (if GOOGLE_API_KEY set),
// then OG/meta scraping as the last fallback. Returns { domain, description, image, url, source }.

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'Missing domain query' });

  // Helper to call Wikipedia search + summary
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

  // Try Wikipedia using a friendly company name derived from domain
  const inferredName = domain.split('.').slice(0, -1).join(' ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const wikiResult = await tryWikipedia(inferredName);
  if (wikiResult) return res.status(200).json({ domain, ...wikiResult });

  // If Wikipedia didn't find useful content, try Google Knowledge Graph if available
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
          if (desc || image) {
            return res.status(200).json({ domain, description: desc || '', image: image || null, url, source: 'kg' });
          }
        }
      }
    } catch (err) {
      console.error('KG error', err);
    }
  }

  // Final fallback: OG/meta scraping of the homepage
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

    if (description || image) {
      return res.status(200).json({ domain, description, image, url: finalUrl || `https://${domain}`, source: 'og' });
    }
  }

  // nothing found
  return res.status(200).json({ domain, description: '', image: null, url: null, source: 'none' });
}
