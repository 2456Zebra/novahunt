// Returns usage counts and plan limits for the signed-in local user (from x-nh-session header).
import { getKV } from './_kv-wrapper';
const kv = getKV();

function planFromPriceId(priceId) {
  if (!priceId) return 'free';
  if (process.env.PRICE_ID_STARTER_MONTHLY && priceId === process.env.PRICE_ID_STARTER_MONTHLY) return 'starter';
  if (process.env.PRICE_ID_PRO_MONTHLY && priceId === process.env.PRICE_ID_PRO_MONTHLY) return 'pro';
  if (process.env.PRICE_ID_TEAM_MONTHLY && priceId === process.env.PRICE_ID_TEAM_MONTHLY) return 'team';
  return 'free';
}

const PLAN_LIMITS = {
  free: { searches: 5, reveals: 2 },
  starter: { searches: 500, reveals: 100 },
  pro: { searches: 2000, reveals: 500 },
  team: { searches: 10000, reveals: 2000 },
};

function parseEmailFromHeader(sessionHeader) {
  if (!sessionHeader) return null;
  try {
    const parsed = JSON.parse(sessionHeader);
    return parsed?.email || null;
  } catch (e) {
    if (typeof sessionHeader === 'string' && sessionHeader.includes('@')) return sessionHeader;
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const sessionHeader = req.headers['x-nh-session'] || '';
    const email = parseEmailFromHeader(sessionHeader);

    if (!email) {
      return res.status(200).json({ subscribed: false, plan: 'free', limits: PLAN_LIMITS.free, used: { searches: 0, reveals: 0 } });
    }

    const emailKey = email.toLowerCase();

    // read subscription data
    let subscription = null;
    try {
      if (kv) subscription = await kv.get(`stripe:subscription:${emailKey}`);
    } catch (e) {
      console.warn('KV read error (account-usage subscription)', e?.message || e);
    }

    const priceId = subscription?.priceId || subscription?.raw?.items?.data?.[0]?.price?.id || null;
    const plan = planFromPriceId(priceId);

    // read usage counters
    let searchesUsed = 0;
    let revealsUsed = 0;
    try {
      if (kv) {
        const s = await kv.get(`usage:searches:${emailKey}`);
        const r = await kv.get(`usage:reveals:${emailKey}`);
        searchesUsed = parseInt(s || '0', 10) || 0;
        revealsUsed = parseInt(r || '0', 10) || 0;
      }
    } catch (e) {
      console.warn('KV read error (account-usage counts)', e?.message || e);
    }

    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    return res.status(200).json({
      email: emailKey,
      plan,
      limits,
      used: { searches: searchesUsed, reveals: revealsUsed },
      subscribed: plan !== 'free',
      subscription: subscription || null,
    });
  } catch (err) {
    console.error('account-usage error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
