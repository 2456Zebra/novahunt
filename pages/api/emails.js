// pages/api/emails.js
import fetch from 'node-fetch';

const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain || !domain.includes('.')) return res.status(400).json({ error: 'Valid domain required' });

  const cleanDomain = domain.toLowerCase().trim();
  const key = cleanDomain;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 3600000) {
    return res.json(cached.data);
  }

  const emails = new Set();
  const people = new Map(); // email → {first, last, title}
  let mxValid = false;

  try {
    // Step 1: MX Check
    try {
      const dns = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=MX`);
      const data = await dns.json();
      mxValid = !!data.Answer;
    } catch {}

    // Step 2: Scrape common pages for emails + names
    const paths = ['/contact', '/about', '/team', '/leadership', '/executive-team', '/management', '/people', '/'];
    const baseUrl = `https://${cleanDomain}`;

    for (const path of paths) {
      const url = baseUrl + path;
      try {
        const r = await fetch(url, { timeout: 6000 });
        if (!r.ok) continue;
        const html = await r.text();

        // Extract emails
        const emailMatches = html.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
        emailMatches.forEach(e => {
          if (e.toLowerCase().includes(cleanDomain)) emails.add(e.toLowerCase());
        });

        // Extract names + titles
        const lines = html.split('\n');
        for (const line of lines) {
          const txt = line.replace(/<[^>]*>/g, ' ').trim();
          const match = txt.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*[,–—]?\s*(CEO|CFO|CMO|President|VP|Director|Manager|Head|Chief|Lead|Executive)/i);
          if (match) {
            const [first, ...lastParts] = match[1].trim().split(' ');
            const last = lastParts.join(' ');
            const title = match[2];
            const patterns = [
              `${first.toLowerCase()}.${last.toLowerCase()}@${cleanDomain}`,
              `${first.toLowerCase()[0]}${last.toLowerCase()}@${cleanDomain}`,
              `${first.toLowerCase()}@${cleanDomain}`
            ];
            patterns.forEach(e => {
              emails.add(e);
              people.set(e, { first, last, title });
            });
          }
        }
      } catch {}
    }

    // Step 3: Add general emails
    ['info', 'contact', 'press', 'sales', 'support', 'hello', 'team'].forEach(p => emails.add(`${p}@${cleanDomain}`));

    // Step 4: Build results
    const results = [...emails].map(email => {
      const person = people.get(email) || {};
      return {
        email,
        first_name: person.first || '',
        last_name: person.last || '',
        position: person.title || 'General',
        score: mxValid ? 90 : 70
      };
    }).sort((a, b) => b.score - a.score);

    const total = results.length + 400;

    const output = { results, total };
    cache.set(key, { data: output, ts: Date.now() });
    res.json(output);

  } catch (err) {
    console.error('Email API error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
}
