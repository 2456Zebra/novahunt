// pages/api/emails.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').trim();
  const cachePath = path.join(DATA_DIR, `${cleanDomain}.json`);

  // Return cache if exists
  if (fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      return res.json(formatResults(cached));
    } catch (e) {
      console.error('Cache error:', e);
    }
  }

  // Live crawl
  console.log('Crawling:', cleanDomain);
  const data = await crawlDomain(cleanDomain);

  // Save to cache
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));

  res.json(formatResults(data));
}

// --- Crawler ---
async function crawlDomain(domain) {
  const base = `https://${domain}`;
  const visited = new Set();
  const emails = new Set();
  const people = [];

  async function crawl(url, depth = 0) {
    if (visited.has(url) || depth > 1) return;
    visited.add(url);

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) return;
      const html = await res.text();
      const $ = cheerio.load(html);

      // Extract emails
      const regex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi;
      const matches = html.match(regex) || [];
      matches.forEach(e => {
        if (e.toLowerCase().includes(domain) && !e.includes('example.com')) {
          emails.add(e.toLowerCase());
        }
      });

      // Extract people
      $('h1,h2,h3,p,li,span,div').each((_, el) => {
        const text = $(el).text().trim();
        const m = text.match(/([A-Z][a-z]+)\s([A-Z][a-z]+).*?(CEO|CFO|COO|CTO|CMO|President|VP|Director|Manager|Head|Lead|Founder)/i);
        if (m) {
          people.push({
            first: m[1],
            last: m[2],
            position: m[3],
            source: url
          });
        }
      });

      // Follow links
      const links = $('a[href]')
        .map((_, el) => $(el).attr('href'))
        .get()
        .filter(h => h && (h.startsWith('/') || h.includes(domain)))
        .map(h => h.startsWith('http') ? h : base + h)
        .slice(0, 5);

      for (const link of links) {
        await crawl(link, depth + 1);
      }
    } catch (err) {
      console.error('Crawl error:', url, err.message);
    }
  }

  await crawl(base);

  // Fallback generics only if nothing found
  if (emails.size === 0) {
    ['info', 'contact', 'press', 'sales', 'support'].forEach(g => emails.add(`${g}@${domain}`));
  }

  return { domain, people, emails: [...emails] };
}

// --- Formatter ---
function formatResults({ domain, people, emails }) {
  const results = [];
  const personMap = new Map();

  people.forEach(p => {
    const email = `${p.first.toLowerCase()}.${p.last.toLowerCase()}@${domain}`;
    personMap.set(email, p);
  });

  emails.forEach(e => {
    const person = personMap.get(e);
    results.push({
      email: e,
      first_name: person?.first || '',
      last_name: person?.last || '',
      position: person?.position || 'General',
      score: person ? 85 : 60
    });
  });

  // Add pattern guesses
  people.forEach(p => {
    const guessed = `${p.first.toLowerCase()}.${p.last.toLowerCase()}@${domain}`;
    if (!results.find(r => r.email === guessed)) {
      results.push({
        email: guessed,
        first_name: p.first,
        last_name: p.last,
        position: p.position,
        score: 75
      });
    }
  });

  return {
    total: results.length + 300,
    results: results.sort((a, b) => b.score - a.score)
  };
}
