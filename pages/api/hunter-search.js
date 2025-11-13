// Server-side API route to call Hunter. Keep API key server-side.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { domain } = req.body || {};
    if (!domain) return res.status(400).json({ error: 'domain required in POST body' });

    const key = process.env.HUNTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'Hunter API key is not configured' });

    // Hunter v2 domain-search endpoint pattern:
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(key)}`;

    const r = await fetch(url);
    const text = await r.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      // non-json response
      return res.status(502).json({ error: 'Hunter returned non-JSON', status: r.status, body: text });
    }

    if (!r.ok) {
      return res.status(502).json({ error: 'Hunter API error', status: r.status, body: json });
    }

    // Forward the hunter payload for now; client normalizes expected shapes.
    return res.status(200).json({ data: json });
  } catch (err) {
    console.error('hunter-search error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
