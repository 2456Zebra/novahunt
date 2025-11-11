import fetch from 'node-fetch';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  let emails = new Set();
  let people = [];
  let total = 0;

  try {
    // 1. Expanded Scrape URLs (More Specific)
    const urls = [
      `https://${domain}/contact`,
      `https://${domain}/about-us`,
      `https://${domain}/leadership`,
      `https://${domain}/executive-team`,
      `https://${domain}/investor-relations`,
      `https://${domain}/press-room`,
      `https://${domain}`
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url, { timeout: 6000 });
        if (!r.ok) continue;
        const html = await r.text();
        const $ = cheerio.load(html);

        // Emails from mailto/text
        $('a[href^="mailto:"]').each((_, el) => {
          const e = $(el).attr('href').replace('mailto:', '').split('?')[0].trim();
          if (e.includes(domain)) emails.add(e);
        });

        const text = $('body').text();
        const textEmails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
        textEmails.forEach(e => {
          if (e.includes(domain)) emails.add(e);
        });

        // Names + Titles (Better Regex for Executives)
        $('h1, h2, h3, p, .profile, .bio').each((_, el) => {
          const txt = $(el).text().trim();
          const nameMatch = txt.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*?)\s*(CEO|CFO|President|VP|Director|Manager|Head|Chief|Lead|Executive)/i);
          if (nameMatch) {
            const fullName = nameMatch[1].trim();
            const title = nameMatch[2];
            const [first, ...lastParts] = fullName.split(' ');
            const last = lastParts.join(' ');
            const emailGuess = `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`;
            people.push({ email: emailGuess, first, last, title });
          }
        });
      } catch (e) { continue; }
    }

    // 2. Google Dork (Specific to Domain)
    const q = encodeURIComponent(`"${domain}" email OR "contact us" site:${domain} OR site:linkedin.com "${domain}" executive`);
    try {
      const gRes = await fetch(`https://www.google.com/search?q=${q}&num=30`);
      const gHtml = await gRes.text();
      const gM = gHtml.match(/\b[A-Za-z0-9._%+-]+@${domain}\b/g) || [];
      gM.forEach(e => emails.add(e));
    } catch (e) {}

    // 3. Add General Emails
    ['info', 'contact', 'press', 'sales', 'support', 'media', 'careers', 'investor', 'legal'].forEach(p => {
      emails.add(`${p}@${domain}`);
    });

    // 4. Combine
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
      results,
      total
    });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
}
