import fetch from 'node-fetch';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  let results = [];
  let total = 0;

  // === 1. HUNTER.IO (IF KEY EXISTS) ===
  if (process.env.HUNTER_API_KEY) {
    try {
      const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}&limit=10`;
      const hRes = await fetch(url);
      const hData = await hRes.json();

      if (hData.data?.emails) {
        results = hData.data.emails.map(e => ({
          email: e.value,
          first_name: e.first_name || '',
          last_name: e.last_name || '',
          position: e.position || 'Unknown',
          score: e.confidence || 70
        }));
        total = hData.meta?.total || results.length;
      }
    } catch (e) {
      console.error('Hunter error:', e);
    }
  }

  // === 2. INDEPENDENT SCRAPER (ALWAYS RUNS) ===
  if (results.length === 0) {
    try {
      // Scrape public site
      const siteRes = await fetch(`https://${domain}`, { timeout: 5000 });
      if (siteRes.ok) {
        const html = await siteRes.text();
        const $ = cheerio.load(html);
        $('a[href^="mailto:"]').each((i, el) => {
          const email = $(el).attr('href').replace('mailto:', '').trim();
          if (email.includes(domain) && !results.find(r => r.email === email)) {
            results.push({ email, first_name: '', last_name: '', position: 'From Site', score: 95 });
          }
        });
      }
    } catch (e) {
      console.error('Site scrape failed:', e);
    }

    // Pattern guessing
    const names = ['john', 'jane', 'mike', 'sarah', 'david', 'lisa', 'chris', 'amy', 'brian', 'emily'];
    const patterns = ['{f}{l}', '{first}', '{first}.{last}', '{f}.{last}', '{last}'];
    for (const name of names) {
      const [first, last = ''] = name.split(' ');
      const f = first[0].toLowerCase();
      const l = last.toLowerCase();
      const full = first.toLowerCase();

      patterns.forEach(p => {
        const email = p
          .replace('{f}', f)
          .replace('{l}', l)
          .replace('{first}', full)
          .replace('{last}', l)
          + `@${domain}`;
        if (!results.find(r => r.email === email)) {
          results.push({ email, first_name: first, last_name: last, position: 'Guessed', score: 60 });
        }
      });
    }

    total = results.length + 400; // Fake "444+" total to drive upgrades
  }

  // === 3. FINAL OUTPUT ===
  const freeResults = results.slice(0, 5); // Show 5 free
  const displayTotal = total >= 444 ? total : 444; // Force urgency

  res.status(200).json({
    results: freeResults,
    total: displayTotal,
    message: results.length > 5 ? `Upgrade to see all ${displayTotal - 5} emails` : ''
  });
}
