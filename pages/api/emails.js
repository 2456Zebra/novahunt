export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key missing' });

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}&limit=500`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data?.emails) {
      return res.status(200).json({ results: [], total: 0 });
    }

    const emails = data.data.emails.map(e => ({
      email: e.value,
      first_name: e.first_name || '',
      last_name: e.last_name || '',
      position: e.position || '',
      score: e.confidence || 0
    }));

    res.status(200).json({
      results: emails,
      total: emails.length
    });
  } catch (err) {
    console.error('Hunter API error:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
}
