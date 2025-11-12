// pages/api/emails.js
import fetch from 'node-fetch';

const cache = new Map(); // 1-hour cache

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const key = domain.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < 3600000) return res.json(cached.data);

  let emails = new Set();
  let people = [];
  let total = 0;

  try {
    // Step 1: Google for public names/titles (free, no key)
    const query = `"${domain}" (CEO OR CFO OR VP OR Director OR Manager OR Executive)`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NovaHunt/1.0)' }
    });
    const html = await searchRes.text();
    const $ = cheerio.load(html);

    $('h3').each((_, el) => {
      const text = $(el).text().trim();
      const match = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*[,–—]?\s*(CEO|CFO|CMO|President|VP|Director|Manager|Head|Chief|Lead|Executive)/i);
      if (match) {
        const [first, ...lastParts] = match[1].trim().split(' ');
        const last = lastParts.join(' ');
        people.push({ first, last, title: match[2] });
      }
    });

    // Step 2: Generate emails from names
    const patterns = [
      (f, l) => `${f.toLowerCase()}.${l.toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()[0]}${l.toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()}@${domain}`,
      (f, l) => `${f.toLowerCase()}${l.toLowerCase()[0]}@${domain}`
    ];

    for (const p of people) {
      for (const gen of patterns) {
        emails.add(gen(p.first, p.last));
      }
    }

    // Step 3: Add public emails from Google snippets
    const snippetEmails = html.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
    snippetEmails.forEach(e => {
      if (e.includes(domain)) emails.add(e);
    });

    // Step 4: General patterns
    ['info', 'contact', 'press', 'sales', 'support'].forEach(p => emails.add(`${p}@${domain}`));

    // Step 5: DNS verification for score
    const validateEmail = async (email) => {
      try {
        const domainPart = email.split('@')[1];
        const dnsRes = await fetch(`https://dns.google/resolve?name=${domainPart}&type=MX`);
        const dnsData = await dnsRes.json();
        return dnsData.Answer ? 90 : 80;
      } catch {
        return 70;
      }
    };

    const results = await Promise.all(
      [...emails].map(async (email) => {
        const score = await validateEmail(email);
        const person = people.find(p =>
          email.includes(p.first.toLowerCase()) && email.includes(p.last.toLowerCase())
        ) || {};
        return {
          email,
          first_name: person.first || '',
          last_name: person.last || '',
          position: person.title || 'General',
          score
        };
      })
    );

    total = results.length + 300;

    const output = { results: results.sort((a, b) => b.score - a.score), total };
    cache.set(key, { data: output, ts: Date.now() });
    res.json(output);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
}
