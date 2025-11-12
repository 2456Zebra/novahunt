// pages/api/emails.js
import fetch from 'node-fetch';

const cache = new Map();

// Strict name regex
const NAME_REGEX = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*[,–—]?\s*(CEO|CFO|CMO|President|VP|Director|Manager|Head|Chief|Lead|Executive|Founder)/i;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const NOISE = ['google', 'tag', 'notification', 'script', 'div', 'class', 'id', 'href'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain || !domain.includes('.')) return res.status(400).json({ error: 'Valid domain required' });

  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').trim();
  const key = cleanDomain;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 3600000) return res.json(cached.data);

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

    // Step 2: Scrape leadership/team pages
    const paths = ['/team', '/leadership', '/about', '/people', '/management', '/executive-team', '/contact', '/'];
    const baseUrl = `https://${cleanDomain}`;

    for (const path of paths) {
      const url = baseUrl + path;
      try {
        const r = await fetch(url, { timeout: 7000 });
        if (!r.ok) continue;
        const html = await r.text();

        // Extract clean emails
        const emailMatches = html.match(EMAIL_REGEX) || [];
        emailMatches.forEach(e => {
          const lower = e.toLowerCase();
          if (lower.includes(cleanDomain) && !NOISE.some(n => lower.includes(n))) {
            emails.add(lower);
          }
        });

        // Extract clean names + titles
        const lines = html.split('\n');
        for (const line of lines) {
          const txt = line.replace(/<[^>]*>/g, ' ').replace(/[^a-zA-Z\s,–—]/g, ' ').trim();
          const match = txt.match(NAME_REGEX);
          if (match && txt.length < 200) { // avoid long junk
            const fullName = match[1].trim();
            const title = match[2];
            const nameParts = fullName.split(' ');
            const first = nameParts[0];
            const last = nameParts.slice(1).join(' ');
            if (first && last && first.length > 1 && last.length > 1) {
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
        }
      } catch {}
    }

    // Step 3: Add general emails (only if no real ones)
    if (emails.size === 0) {
      ['info', 'contact', 'press', 'sales', 'support'].forEach(p => emails.add(`${p}@${cleanDomain}`));
    }

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
