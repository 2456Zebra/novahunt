// pages/api/enrich-company.js
// Lightweight enrichment: tries OG/meta scraping, then (optionally) Google Knowledge Graph Search API if GOOGLE_API_KEY is set.
// Returns { domain, description, image, url, source: 'og'|'kg'|'none' }

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'Missing domain query' });

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
      // try next url
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

  // OG/meta extraction failed or was empty — try Google Knowledge Graph if API key is set
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
          // try to extract description fields
          const desc = (item.detailedDescription && (item.detailedDescription.articleBody || item.detailedDescription.articleBody)) || item.description || item.name || '';
          // images sometimes at result.image.contentUrl
          const image = item.image && (item.image.contentUrl || item.image.url) ? (item.image.contentUrl || item.image.url) : null;
          return res.status(200).json({ domain, description: desc || '', image: image || null, url: item.url || null, source: 'kg' });
        }
      }
    } catch (err) {
      console.error('KG error', err);
    }
  }

  // nothing found
  return res.status(200).json({ domain, description: '', image: null, url: null, source: 'none' });
}
