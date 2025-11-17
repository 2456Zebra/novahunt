// pages/api/emails.js
import { createClient } from '@upstash/redis';

const redis = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain } = req.body;
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Valid domain required' });
  }

  if (!HUNTER_API_KEY) {
    console.error('HUNTER_API_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // Cache key
  const cacheKey = `hunter:${domain}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${HUNTER_API_KEY}&limit=100`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.errors?.[0]?.message || `Hunter error: ${response.status}`);
    }

    const data = await response.json();
    const emails = data.data?.emails || [];

    const results = emails.map(e => ({
      email: e.value,
      first_name: e.first_name || '',
      last_name: e.last_name || '',
      position: e.position || 'Unknown',
      score: e.confidence || 0,
    }));

    const result = { results, total: results.length };

    // Cache for 24h
    await redis.set(cacheKey, result, { ex: 86400 });

    return res.json(result);
  } catch (err) {
    console.error('Hunter error:', err.message);
    return res.status(500).json({ error: 'Search failed. Try again.' });
  }
}
