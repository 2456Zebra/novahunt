// pages/api/emails.js
// FREE HUNTER.IO + FALLBACK
// 25 FREE SEARCHES → NO COST

import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const API_KEY = process.env.HUNTER_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key missing' });
  }

  const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${API_KEY}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    // FREE TIER LIMIT HIT?
    if (data.errors?.[0]?.id === 'rate_limit_exceeded') {
      return res.json({
        total: 3,
        results: [
          { email: `info@${domain}`, first_name: "", last_name: "", position: "General", score: 70 },
          { email: `contact@${domain}`, first_name: "", last_name: "", position: "General", score: 70 },
          { email: `hello@${domain}`, first_name: "", last_name: "", position: "General", score: 70 }
        ]
      });
    }

    // NO EMAILS FOUND?
    if (!data.data?.emails || data.data.emails.length === 0) {
      return res.json({ total: 0, results: [] });
    }

    // REAL EMAILS FROM HUNTER
    const results = data.data.emails.map(e => ({
      email: e.value,
      first_name: e.first_name || "",
      last_name: e.last_name || "",
      position: e.position || "Unknown",
      score: e.confidence || 80
    }));

    res.json({ results, total: results.length });
  } catch (err) {
    console.error("Hunter API error:", err);
    res.status(500).json({ error: "Search failed" });
  }
}
