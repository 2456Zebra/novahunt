// pages/api/emails.js
// 100% HUNTER.IO — REAL EMAILS, NAMES, TITLES, CONFIDENCE

import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const API_KEY = process.env.HUNTER_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'API key missing' });

  const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${API_KEY}&limit=50`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    if (data.errors) {
      if (data.errors[0].id === 'rate_limit_exceeded') {
        return res.json({ total: 0, results: [], message: "Free tier limit reached" });
      }
      return res.json({ total: 0, results: [], error: data.errors[0].details });
    }

    const emails = data.data.emails || [];
    const total = data.data.total || emails.length;

    const results = emails.map(e => ({
      email: e.value.includes('*') ? `********@${domain}` : e.value,
      first_name: e.first_name || "",
      last_name: e.last_name || "",
      position: e.position || "Unknown",
      score: e.confidence || 80,
      revealed: !e.value.includes('*')
    }));

    res.json({ results, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
}
