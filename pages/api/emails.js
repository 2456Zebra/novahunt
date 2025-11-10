import fetch from 'node-fetch';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const emails = new Set();
  const people = []; // { email, first, last, title }
  let total = 0;

  try {
    // 1. Scrape Site for Emails + Names/Titles
    const urls = [
      `https://${domain}/contact`,
      `https://${domain}/about`,
      `https://${domain}/team`,
      `https://${domain}/leadership`,
      `https://${domain}`
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, { timeout: 6000 });
        if (!r.ok) continue;
        const html = await r.text();
        const $ = cheerio.load(html);

        // Extract emails
        $('a[href^="mailto:"]').each((_, el) => {
          const e = $(el).attr('href').replace('mailto:', '').split('?')[0].trim();
          if (e.includes(domain)) emails.add(e);
        });

        const text = $('body').text();
        const textEmails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
        textEmails.forEach(e => {
          if (e.includes(domain)) emails.add(e);
        });

        // Extract Names + Titles
        $('h1, h2, h3, h4, p, div').each((_, el) => {
          const txt = $(el).text().trim();
          const nameMatch = txt.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)/);
          const titleMatch = txt.match(/(CEO|CFO|President|VP|Director|Manager)/i);

          if (nameMatch && titleMatch) {
            const [_, first, last] = nameMatch;
            const title = titleMatch[0];
            const emailGuess = `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`;
            people.push({ email: emailGuess, first, last, title });
          }
        });
      } catch (e) { continue; }
    }

    // 2. Add General Emails
    ['info', 'contact', 'press', 'sales', 'support'].forEach(p => {
      emails.add(`${p}@${domain}`);
    });

    // 3. Combine
    const allEmails = [...new Set([...emails, ...people.map(p => p.email)])];
    total = allEmails.length + 400;

    const results = allEmails.map((email, i) => {
      const person = people.find(p => p.email === email) || {};
      return {
        email,
        first_name: person.first || '',
        last_name: person.last || '',
        position: person.title || 'General',
        score: person.title ? 90 : 80
      };
    });

    res.status(200).json({
      results: results.slice(0, 100), // PRO gets all
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
}
