// Debug endpoint for find-company
// - Calls Hunter if HUNTER_API_KEY set (limit=5 to be safe) and fetches OG/meta from the homepage
// - Returns detailed diagnostic info to help you see what's failing in production
// - Do NOT leave this deployed in production long-term (it returns debug info).
export default async function handler(req, res) {
  const domain = (req.query.domain || '').toString().trim().toLowerCase();
  if (!domain) {
    res.status(400).json({ error: 'domain required (example: ?domain=coca-cola.com)' });
    return;
  }

  const debug = {
    domain,
    env: {
      HUNTER_API_KEY_present: !!process.env.HUNTER_API_KEY,
      NODE_ENV: process.env.NODE_ENV || null,
    },
    hunter: { called: false, error: null, raw: null },
    og: { called: false, error: null, meta: null, status: null },
  };

  // Helper to fetch JSON safely
  async function fetchJson(url, opts = {}) {
    try {
      const r = await fetch(url, opts);
      const text = await r.text();
      try { return { status: r.status, ok: r.ok, json: JSON.parse(text), text }; } catch (e) { return { status: r.status, ok: r.ok, json: null, text }; }
    } catch (err) {
      return { status: null, ok: false, json: null, text: null, error: err && err.message };
    }
  }

  // 1) Hunter call (if key present)
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY || null;
  if (HUNTER_API_KEY) {
    try {
      debug.hunter.called = true;
      const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=5&api_key=${encodeURIComponent(HUNTER_API_KEY)}`;
      const result = await fetchJson(url);
      debug.hunter.raw = result;
    } catch (e) {
      debug.hunter.error = e && e.message;
    }
  } else {
    debug.hunter.error = 'HUNTER_API_KEY not set in environment';
  }

  // 2) Try to fetch homepage and extract OG/meta
  try {
    debug.og.called = true;
    const siteUrl = `https://${domain}`;
    const r = await fetch(siteUrl, { redirect: 'follow' }).catch(e => ({ ok: false, status: null, error: e && e.message }));
    if (!r || !r.ok) {
      debug.og.status = r && r.status;
      debug.og.error = r && r.error ? r.error : (r && r.status ? `HTTP ${r.status}` : 'fetch failed');
    } else {
      const text = await r.text().catch(() => '');
      debug.og.textLength = (text && text.length) || 0;
      // Extract some OG tags
      const ogDesc = text.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const ogImg = text.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const metaDesc = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const titleMatch = text.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
        || text.match(/<title[^>]*>([^<]+)<\/title>/i);

      debug.og.meta = {
        ogDescription: ogDesc && ogDesc[1] ? String(ogDesc[1]).trim() : null,
        ogImage: ogImg && ogImg[1] ? String(ogImg[1]).trim() : null,
        metaDescription: metaDesc && metaDesc[1] ? String(metaDesc[1]).trim() : null,
        title: titleMatch && titleMatch[1] ? String(titleMatch[1]).trim() : null,
      };
    }
  } catch (e) {
    debug.og.error = e && e.message;
  }

  // 3) Return debug info
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(debug);
}
