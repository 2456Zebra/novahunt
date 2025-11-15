// Called by client when user clicks Reveal on a contact.
// Increments reveal count and returns remaining reveals and whether allowed.
// Body: { contact: { value, ... } } (contact is optional - we only need to increment usage)
// Header: x-nh-session with local session JSON that includes email.
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const sessionHeader = req.headers['x-nh-session'] || '';
    if (!sessionHeader) return res.status(401).json({ error: 'Not signed in' });

    let email = null;
    try {
      const parsed = JSON.parse(sessionHeader);
      email = parsed?.email || null;
    } catch (e) {
      if (typeof sessionHeader === 'string' && sessionHeader.includes('@')) email = sessionHeader;
    }

    if (!email) return res.status(401).json({ error: 'Not signed in' });

    const emailKey = email.toLowerCase();

    // determine plan/limits from stored subscription if present
    let subscription = null;
    try {
      if (kv) subscription = await kv.get(`stripe:subscription:${emailKey}`);
    } catch (e) {
      console.warn('KV read error (reveal subscription)', e?.message || e);
    }

    const priceId = subscription?.priceId || null;
    const plan = planFromPriceId(priceId);
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // increment reveal counter
    let reveals = 0;
    try {
      if (kv) {
        const cur = parseInt((await kv.get(`usage:reveals:${emailKey}`)) || 0, 10) || 0;
        reveals = cur + 1;
        await kv.set(`usage:reveals:${emailKey}`, reveals);
      } else {
        // If no kv, we can't persist — return allowed but with no counter
        return res.status(200).json({ allowed: true, reveals: 0, remaining: limits.reveals });
      }
    } catch (e) {
      console.warn('KV write error (reveal increment)', e?.message || e);
      return res.status(500).json({ error: 'KV write error' });
    }

    const remaining = Math.max(0, limits.reveals - reveals);
    const allowed = reveals <= limits.reveals;

    return res.status(200).json({ allowed, reveals, remaining, limits });
  } catch (err) {
    console.error('reveal error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
