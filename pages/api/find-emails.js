// pages/api/find-emails.js
import { createClient } from '@upstash/redis';

const redis = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

function maskEmailAddr(email) {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  if (local.length <= 2) return `* @${domain}`;
  // reveal first char and last char of local, mask middle
  const first = local[0];
  const last = local[local.length - 1];
  return `${first}${'*'.repeat(Math.max(3, local.length - 2))}${last}@${domain}`;
}

function maskResultForPublic(resultObj, session) {
  if (!resultObj || !Array.isArray(resultObj.items)) return resultObj;
  if (!session) {
    // user not signed in — mask emails and add reveal hints
    const maskedItems = resultObj.items.map(it => {
      const masked = Object.assign({}, it);
      masked.maskedEmail = maskEmailAddr(it.email || '');
      // remove actual email to avoid accidental exposure
      delete masked.email;
      return masked;
    });
    return {
      items: maskedItems,
      total: resultObj.total,
      public: true,
      canReveal: false,
      revealUrl: '/plans?source=search'
    };
  } else {
    // signed in — include full result
    return {
      items: resultObj.items,
      total: resultObj.total,
      public: false,
      canReveal: true
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domain } = req.body;
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Valid domain required' });
  }

  // Get session if exists
  const sessionToken = req.headers['x-nh-session'];
  const session = sessionToken ? { token: sessionToken } : null;

  if (!HUNTER_API_KEY) {
    console.error('HUNTER_API_KEY missing');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  // Cache key
  const cacheKey = `hunter:${domain}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    const publicResult = maskResultForPublic(cached, session);
    return res.status(200).json(Object.assign({ ok: true }, publicResult));
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

    const items = emails.map(e => ({
      email: e.value,
      first_name: e.first_name || '',
      last_name: e.last_name || '',
      position: e.position || 'Unknown',
      score: e.confidence || 0,
    }));

    const result = { items, total: items.length };

    // Cache for 24h
    await redis.set(cacheKey, result, { ex: 86400 });

    const publicResult = maskResultForPublic(result, session);
    return res.status(200).json(Object.assign({ ok: true }, publicResult));
  } catch (err) {
    console.error('Hunter error:', err.message);
    return res.status(500).json({ error: 'Search failed. Try again.' });
  }
}
