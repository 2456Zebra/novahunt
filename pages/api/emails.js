// pages/api/emails.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { domain } = req.body;
  if (!domain || !domain.includes('.')) return res.status(400).json({ error: 'Valid domain required' });

  const results = [];

  try {
    // 1. Scrape website for emails
    try {
      const siteRes = await fetch(`https://${domain}`, { timeout: 5000 });
      const text = await siteRes.text();
      const emails = text.match(/[\w\.-]+@[\w\.-]+\.[\w]{2,}/g) || [];
      emails.forEach(email => {
        if (email.includes(domain) && !results.find(r => r.email === email)) {
          results.push({ email, role: 'Website', score: 95 });
        }
      });
    } catch (e) {}

    // 2. Hunter.io fallback (free tier)
    if (process.env.HUNTER_API_KEY && results.length === 0) {
      try {
        const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`;
        const hRes = await fetch(url);
        const hData = await hRes.json();
        if (hData.data?.emails) {
          hData.data.emails.forEach(e => {
            if (!results.find(r => r.email === e.value)) {
              results.push({ email: e.value, role: e.type || 'Unknown', score: e.confidence || 80 });
            }
          });
        }
      } catch (e) {}
    }

    // 3. AI Guesses if nothing found
    if (results.length === 0) {
      const guesses = [`support@${domain}`, `hello@${domain}`, `info@${domain}`];
      guesses.forEach(email => results.push({ email, role: 'AI Guess', score: 60 }));
    }

    res.status(200).json({
      results: results.slice(0, 10),
      message: `${results.length} email${results.length === 1 ? '' : 's'} found!`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed', details: error.message });
  }
}
