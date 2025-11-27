// pages/api/enrich-company.js
// Lightweight, server-side enrichment that fetches the company's homepage and extracts OG/meta title/description/image.
// This is decorative only and intended as a free fallback (no external paid API required).

export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) return res.status(400).json({ error: 'Missing domain query' });

  // Try to fetch the site's root (http(s) preferring https)
  const urlsToTry = [
    `https://${domain}`,
    `http://${domain}`,
    `https://www.${domain}`,
    `http://www.${domain}`
  ];

  let html = null;
  let finalUrl = null;

  for (const u of urlsToTry) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaHunt/1.0)' }, redirect: 'follow', timeout: 10000 });
      if (r.ok) {
        html = await r.text();
        finalUrl = r.url || u;
        break;
      }
    } catch (err) {
      // try next
    }
  }

  if (!html) {
    return res.status(200).json({ domain, description: '', image: null, url: null });
  }

  // crude but effective extraction of meta/og tags
  function extractMeta(nameCandidates) {
    for (const name of nameCandidates) {
      const re = new RegExp(`<meta[^>]+(?:property|name)=(?:'|")${name}(?:'|")[^>]*content=(?:'|")([^'"]+)(?:'|")`, 'i');
      const m = re.exec(html);
      if (m && m[1]) return m[1].trim();
    }
    return '';
  }

  const ogDescription = extractMeta(['og:description', 'description', 'twitter:description']);
  const ogTitle = extractMeta(['og:title', 'twitter:title', 'title']);
  const ogImage = extractMeta(['og:image', 'twitter:image', 'image']);
  const faviconMatch = /<link[^>]+rel=(?:'|")icon(?:'|")[^>]*href=(?:'|")([^'"]+)(?:'|")/i.exec(html);
  const favicon = faviconMatch ? faviconMatch[1] : null;

  // Normalize image URL if relative
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

  return res.status(200).json({ domain, description, image, url: finalUrl || `https://${domain}` });
}
