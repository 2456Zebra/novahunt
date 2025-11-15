// Reveal endpoint — requires a valid session (x-nh-session or cookie) that contains an email.
// Increments reveal usage and returns updated counts and allowed flag.
import { getKV } from './_kv-wrapper';
const kv = getKV();

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sessionHeader = req.headers['x-nh-session'] || (req.cookies && req.cookies.nh_session) || '';
    const email = parseEmailFromHeader(sessionHeader);
    if (!email) return res.status(401).json({ error: 'Not signed in' });

    const emailKey = email.toLowerCase();

    // determine plan (from stripe:subscription)
    let subscription = null;
    try {
      if (kv) subscription = await kv.get(`stripe:subscription:${emailKey}`);
    } catch (e) {
      console.warn('KV read error (reveal subscription)', e?.message || e);
    }
    const priceId = subscription?.priceId || subscription?.raw?.items?.data?.[0]?.price?.id || null;
    const plan = planFromPriceId(priceId);
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // increment reveal counter
    let reveals = 0;
    try {
      if (!kv) return res.status(500).json({ error: 'KV not available' });
      const curRaw = await kv.get(`usage:reveals:${emailKey}`);
      const cur = parseInt(curRaw || '0', 10) || 0;
      reveals = cur + 1;
      await kv.set(`usage:reveals:${emailKey}`, String(reveals));
    } catch (e) {
      console.warn('KV write error (reveal increment)', e?.message || e);
      return res.status(500).json({ error: 'KV write error' });
    }

    const remaining = Math.max(0, limits.reveals - reveals);
    const allowed = reveals <= limits.reveals;

    return res.status(200).json({
      allowed,
      reveals,
      remaining,
      limits,
      plan,
      debug: { email: emailKey },
    });
  } catch (err) {
    console.error('reveal error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
