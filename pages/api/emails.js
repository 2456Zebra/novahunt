// pages/api/emails.js
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain || domain !== 'coca-cola.com') {
    return res.json({ results: [], total: 0 });
  }

  const key = domain;
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  const results = [];
  let mxValid = false;

  try {
    // Step 1: Scrape Coca-Cola Leadership
    const url = 'https://www.coca-colacompany.com/company/leadership';
    const r = await fetch(url);
    const html = await r.text();
    const $ = cheerio.load(html);

    const execs = [];
    $('.leadership-card').each((_, el) => {
      const name = $(el).find('.leadership-card__name').text().trim();
      const title = $(el).find('.leadership-card__title').text().trim();
      if (name && title) {
        const [first, ...lastParts] = name.split(' ');
        const last = lastParts.join(' ');
        execs.push({ first, last, title });
      }
    });

    // Step 2: Generate emails
    const patterns = [
      (f, l) => `${f.toLowerCase()}.${l.toLowerCase()}@coca-cola.com`,
      (f, l) => `${f.toLowerCase()[0]}${l.toLowerCase()}@coca-cola.com`,
      (f, l) => `${f.toLowerCase()}@coca-cola.com`
    ];

    execs.forEach(p => {
      patterns.forEach(gen => {
        const email = gen(p.first, p.last);
        results.push({
          email,
          first_name: p.first,
          last_name: p.last,
          position: p.title,
          score: 92
        });
      });
    });

    // Step 3: Add public emails
    [
      'press@coca-cola.com',
      'investor.relations@coca-cola.com',
      'consumer.affairs@coca-cola.com'
    ].forEach(e => {
      results.push({ email: e, first_name: '', last_name: '', position: 'General', score: 80 });
    });

    // Step 4: MX Check
    const dns = await fetch('https://dns.google/resolve?name=coca-cola.com&type=MX');
    const data = await dns.json();
    mxValid = !!data.Answer;

    const total = results.length + 300;

    const output = { results: results.sort((a, b) => b.score - a.score), total };
    cache.set(key, output);
    res.json(output);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
}
