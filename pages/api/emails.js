import fetch from 'node-fetch';
import cheerio from 'cheerio';

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'Domain required' });

  try {
    const hunterRes = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`
    );
    const hunterData = await hunterRes.json();

    if (!hunterData.data || !hunterData.data.emails) {
      return res.status(200).json({ results: [], total: 0 });
    }

    const emails = hunterData.data.emails.map(e => ({
      email: e.value,
      first_name: e.first_name || '',
      last_name: e.last_name || '',
      position: e.position || '',
      score: e.confidence || 0
    }));

    res.status(200).json({
      results: emails,
      total: emails.length  // REAL count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Hunter API failed' });
  }
}
