import fetch from 'node-fetch';
import cheerio from 'cheerio';

const CACHE = new Map(); // In-memory cache
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  const cacheKey = domain.toLowerCase();
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    // Step 1: Try to find contact page
    const contactUrls = [
      `https://${domain}/contact`,
      `https://${domain}/contact-us`,
      `https://${domain}/about`,
      `https://${domain}/team`,
      `https://${domain}/leadership`
    ];

    let emails = new Set();
    let found = false;

    for (const url of contactUrls) {
      try {
        const response = await fetch(url, { timeout: 5000 });
        if (!response.ok) continue;

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract emails from mailto: and text
        $('a[href^="mailto:"]').each((i, el) => {
          const email = $(el).attr('href').replace('mailto:', '').trim();
          if (isValidEmail(email)) emails.add(email);
        });

        // Extract from text
        const text = $('body').text();
        const emailMatches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || [];
        emailMatches.forEach(email => {
          if (email.endsWith(`@${domain}`) || email.includes(domain)) {
            if (isValidEmail(email)) emails.add(email);
          }
        });

        if (emails.size > 0) {
          found = true;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    // Step 2: Fallback - try common patterns
    if (!found) {
      const patterns = [
        `info@${domain}`,
        `contact@${domain}`,
        `hello@${domain}`,
        `sales@${domain}`,
        `support@${domain}`
      ];
      patterns.forEach(email => emails.add(email));
    }

    const emailArray = Array.from(emails).map(email => ({
      email,
      first_name: '',
      last_name: '',
      position: email.includes('info') ? 'General Contact' : 
                email.includes('sales') ? 'Sales' :
                email.includes('support') ? 'Support' : 'Team',
      score: email.includes(`@${domain}`) ? 95 : 70
    }));

    const result = {
      results: emailArray,
      total: emailArray.length
    };

    CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
    res.status(200).json(result);
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: 'Failed to scrape emails' });
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
