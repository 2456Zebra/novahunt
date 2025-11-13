export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'domain required' });

    const key = process.env.HUNTER_API_KEY;
    if (!key) return res.status(500).json({ error: 'Hunter API key not set' });

    // Hunter v2 domain search endpoint (adjust if Hunter API changed)
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${encodeURIComponent(key)}`;

    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      console.error('hunter API error', r.status, text);
      return res.status(502).json({ error: 'Hunter API error', details: text });
    }

    const data = await r.json();
    // You can shape the response here to return only the fields you want
    return res.status(200).json({ data });
  } catch (err) {
    console.error('hunter-search error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
