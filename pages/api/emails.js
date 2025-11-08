// pages/api/emails.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { domain } = req.body;
  if (!domain || !domain.includes('.')) return res.status(400).json({ error: 'Valid domain required' });

  const results = [];

  try {
    // 1. Scrape company site for emails
    try {
      const siteRes = await fetch(`https://${domain}`, { timeout: 5000 });
      const siteText = await siteRes.text();
      const emails = siteText.match(/[\w\.-]+@[\w\.-]+\.[\w]{2,}/g) || [];
      emails.forEach(email => {
        if (email.includes(domain) && !results.find(r => r.email === email)) {
          results.push({ email, role: 'From website', score: 95 });
        }
      });
    } catch (e) {}

    // 2. Hunter.io fallback (free tier)
    if (process.env.HUNTER_API_KEY && results.length === 0) {
      try {
        const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`;
        const hunterRes = await fetch(hunterUrl);
        const hunterData = await hunterRes.json();
        if (hunterData.data?.emails) {
          hunterData.data.emails.forEach(e => {
            if (!results.find(r => r.email === e.value)) {
              results.push({ email: e.value, role: e.type || 'Unknown', score: e.confidence || 80 });
            }
          });
        }
      } catch (e) {}
    }

    // 3. AI Pattern Guess (if no results)
    if (results.length === 0) {
      const patterns = [
        `support@${domain}`,
        `hello@${domain}`,
        `info@${domain}`,
        `contact@${domain}`
      ];
      patterns.forEach(email => {
        results.push({ email, role: 'AI Guess', score: 60 });
      });
    }

    res.status(200).json({ 
      results: results.slice(0, 10), 
      message: `${results.length} email${results.length === 1 ? '' : 's'} found!` 
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
}
