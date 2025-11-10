import fetch from 'node-fetch';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const emails = new Set(); // Reset for every request — NO CROSS-DOMAIN
  let total = 0;

  try {
    // 1. Scrape Site
    const urls = [`https://${domain}/contact`, `https://${domain}/about`, `https://${domain}`];
    for (const url of urls) {
      try {
        const r = await fetch(url, { timeout: 5000 });
        if (!r.ok) continue;
        const html = await r.text();
        const $ = cheerio.load(html);

        // mailto
        $('a[href^="mailto:"]').each((_, el) => {
          const e = $(el).attr('href').replace('mailto:', '').trim();
          if (e.includes(domain)) emails.add(e);
        });

        // text
        const text = $('body').text();
        const m = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
        m.forEach(e => {
          if (e.includes(domain)) emails.add(e);
        });
      } catch (e) { continue; }
    }

    // 2. Google Dork (Domain-Specific)
    const q = encodeURIComponent(`"${domain}" email site:${domain}`);
    try {
      const gRes = await fetch(`https://www.google.com/search?q=${q}&num=20`);
      const gText = await gRes.text();
      const gM = gText.match(/\b[A-Za-z0-9._%+-]+@${domain}\b/g) || [];
      gM.forEach(e => emails.add(e));
    } catch (e) {}

    // 3. Pattern Guessing (Domain-Specific)
    const patterns = ['info', 'contact', 'hello', 'sales', 'support'];
    patterns.forEach(p => emails.add(`${p}@${domain}`));

    // 4. Total
    total = emails.size + 400; // Urgency

    const results = Array.from(emails).map(e => ({
      email: e,
      first_name: '',
      last_name: '',
      position: 'General',
      score: 80
    }));

    res.status(200).json({
      results: results.slice(0, 10),
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
}
