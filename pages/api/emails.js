// pages/api/emails.js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const cache = new Map();

function emailPatterns(first, last, domain) {
  return [
    `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
    `${first.toLowerCase()[0]}${last.toLowerCase()}@${domain}`,
    `${first.toLowerCase()}${last.toLowerCase()[0]}@${domain}`,
    `${first.toLowerCase()}@${domain}`
  ];
}

async function checkMX(domain) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    const data = await res.json();
    return data.Answer ? 90 : 80;
  } catch {
    return 70;
  }
}

// Extracts names from leadership pages
async function scrapeLeadership(domain) {
  const urls = [
    `https://${domain}/about/leadership`,
    `https://${domain}/company/leadership`,
    `https://${domain}/team`,
    `https://${domain}/about`
  ];

  const people = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      $('h1,h2,h3,li,span').each((_, el) => {
        const text = $(el).text().trim();
        // Matches First Last and optional title
        const match = text.match(/^([A-Z][a-z]+)\s([A-Z][a-z]+)(?:\s*[-,–—]?\s*(CEO|CFO|CTO|CMO|President|VP|Director|Manager|Lead|Head))?/i);
        if (match) {
          const [_, first, last, title] = match;
          people.push({ first, last, title: title || 'Executive', source: url });
        }
      });
    } catch (e) {
      // Skip silently
    }
  }
  return people;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const key = domain.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 3600000) return res.json(cached.data);

  try {
    const people = await scrapeLeadership(domain);
    const emailsSet = new Set();

    // Generate pattern-based emails
    for (const p of people) {
      emailPatterns(p.first, p.last, domain).forEach(e => emailsSet.add(e));
    }

    // Add generic emails
    ['info', 'contact', 'press', 'sales', 'support', 'hello', 'team'].forEach(g => emailsSet.add(`${g}@${domain}`));

    // Validate MX and create result objects
    const results = [];
    for (const email of emailsSet) {
      const score = await checkMX(email.split('@')[1]);
      const person = people.find(p =>
        email.includes(p.first.toLowerCase()) && email.includes(p.last.toLowerCase())
      ) || {};
      results.push({
        email,
        first_name: person.first || '',
        last_name: person.last || '',
        position: person.title || 'General',
        score
      });
    }

    const output = {
      total: results.length,
      results: results.sort((a, b) => b.score - a.score)
    };

    cache.set(key, { data: output, ts: Date.now() });
    res.json(output);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
}
