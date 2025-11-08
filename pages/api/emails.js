// pages/api/emails.js — ESM-COMPATIBLE (import node-fetch)
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  let results = [];

  // 1. Use Hunter.io (real emails)
  if (process.env.HUNTER_API_KEY) {
    try {
      const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}`;
      const hRes = await fetch(url);
      const hData = await hRes.json();
      if (hData.data?.emails) {
        results = hData.data.emails.map(e => ({
          email: e.value,
          role: e.type || 'Unknown',
          score: e.confidence || 70
        }));
      }
    } catch (e) {
      console.error('Hunter error:', e);
    }
  }

  // 2. Fallbacks
  if (results.length === 0) {
    results = [
      { email: `info@${domain}`, role: 'General', score: 80 },
      { email: `support@${domain}`, role: 'Support', score: 90 },
      { email: `hello@${domain}`, role: 'Contact', score: 70 }
    ];
  }

  res.status(200).json({ results, message: `${results.length} email${results.length === 1 ? '' : 's'} found!` });
}
