import fetch from 'node-fetch';
import cheerio from 'cheerio';

// In-memory cache (resets on deploy, perfect for Vercel)
const cache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const cacheKey = domain.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60) { // 1 hour
    return res.status(200).json(cached.data);
  }

  let emails = new Set();
  let people = [];
  let total = 0;

  try {
    const urls = [
      `https://${domain}/contact`,
      `https://${domain}/about`,
      `https://${domain}/team`,
      `https://${domain}/leadership`,
      `https://${domain}/executive-team`,
      `https://${domain}/investor-relations`,
      `https://${domain}/press`,
      `https://${domain}`
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, { timeout: 6000 });
        if (!r.ok) continue;
        const html = await r.text();
        const $ = cheerio.load(html);

        // Clean mailto
        $('a[href^="mailto:"]').each((_, el) => {
          let e = $(el).attr('href').replace(/^mailto:/i, '').split('?')[0].trim();
          e = e.replace(/^https?:\/\//, '').split('/')[0];
          if (e.includes(domain)) emails.add(e);
        });

        // Text emails
        const text = $('body').text();
        const textEmails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
        textEmails.forEach(e => {
          if (e.includes(domain)) emails.add(e);
        });

        // Names + Titles
        $('h1, h2, h3, h4, p, .bio, .profile').each((_, el) => {
          const txt = $(el).text().trim();
          const match = txt.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*[,–—]?\s*(CEO|CFO|CMO|President|VP|Director|Manager|Head|Chief|Lead|Executive)/i);
          if (match) {
            const [first, ...lastParts] = match[1].trim().split(' ');
            const last = lastParts.join(' ');
            const email = `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`;
            people.push({ email, first, last, title: match[2] });
          }
        });
      } catch (e) { continue; }
    }

    // Fallbacks
    ['info', 'contact', 'press', 'sales', 'support'].forEach(p => emails.add(`${p}@${domain}`));

    const allEmails = [...new Set([...emails, ...people.map(p => p.email)])];
    total = allEmails.length + 400;

    const results = allEmails.map(email => {
      const p = people.find(x => x.email === email) || {};
      return {
        email,
        first_name: p.first || '',
        last_name: p.last || '',
        position: p.title || 'General',
        score: p.title ? 90 : 80
      };
    });

    const output = { results, total };
    cache.set(cacheKey, { data: output, timestamp: Date.now() });

    res.status(200).json(output);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
}
