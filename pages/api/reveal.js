// Reveal endpoint — require signed-in session and enforce plan limits.
// Replace or merge with your existing reveal logic as appropriate.
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getKV } from './_kv-wrapper';
const kv = getKV();

// Plan limits — keep these in sync with account-usage logic
const PLAN_LIMITS = {
  free: { searches: 5, reveals: 2 },
  starter: { searches: 500, reveals: 100 },
  pro: { searches: 2000, reveals: 500 },
  team: { searches: 10000, reveals: 2000 },
};

function safeParseSession(header) {
  if (!header) return null;
  try {
    return JSON.parse(header);
  } catch (e) {
    if (typeof header === 'string' && header.includes('@')) return { email: header };
    return null;
  }
}

function planFromSubscription(subscription) {
  if (!subscription) return 'free';
  const priceId = subscription.priceId || subscription.raw?.items?.data?.[0]?.price?.id;
  if (!priceId) return 'free';
  if (process.env.PRICE_ID_STARTER_MONTHLY && priceId === process.env.PRICE_ID_STARTER_MONTHLY) return 'starter';
  if (process.env.PRICE_ID_PRO_MONTHLY && priceId === process.env.PRICE_ID_PRO_MONTHLY) return 'pro';
  if (process.env.PRICE_ID_TEAM_MONTHLY && priceId === process.env.PRICE_ID_TEAM_MONTHLY) return 'team';
  return 'free';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email || null;
    if (!email) return res.status(401).json({ ok: false, error: 'Authentication required to reveal' });
    const emailKey = String(email).toLowerCase();

    // read subscription from KV (fallbacks in account-usage will populate if missing)
    let subscription = null;
    try {
      if (kv) subscription = await kv.get(`stripe:subscription:${emailKey}`);
    } catch (e) {
      console.warn('KV read error (reveal subscription)', e?.message || e);
    }

    const plan = planFromSubscription(subscription);
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Check current usage counts
    let revealsUsed = 0;
    try {
      if (kv) {
        const v = await kv.get(`usage:reveals:${emailKey}`);
        revealsUsed = parseInt(v || '0', 10) || 0;
      }
    } catch (e) {
      console.warn('KV read error (reveal count)', e?.message || e);
    }

    if (revealsUsed >= limits.reveals) {
      return res.status(402).json({ ok: false, error: 'Reveal limit reached for your plan', plan, limits, used: { reveals: revealsUsed } });
    }

    // === Reveal provider logic ===
    // If you have an existing reveal implementation, call it here and assign to `revealed`.
    // TODO: Replace placeholder with real reveal provider call (e.g., Hunter integration).
    let revealed = null;
    try {
      // Example placeholder result for testing:
      revealed = { message: 'Revealed (placeholder)', payload: req.body };
      // If you have doReveal(payload) function, replace above line with:
      // revealed = await doReveal(req.body);
    } catch (e) {
      console.error('Reveal provider error', e?.message || e);
      return res.status(500).json({ ok: false, error: 'Reveal provider error' });
    }

    // Increment the reveals counter atomically
    let newReveals = null;
    try {
      if (kv && typeof kv.incr === 'function') {
        newReveals = await kv.incr(`usage:reveals:${emailKey}`, 1);
      } else if (kv) {
        const cur = await kv.get(`usage:reveals:${emailKey}`);
        const n = parseInt(cur || '0', 10) || 0;
        newReveals = n + 1;
        await kv.set(`usage:reveals:${emailKey}`, String(newReveals));
      }
    } catch (e) {
      console.warn('KV increment error (reveals)', e?.message || e);
    }

    const used = {
      reveals: newReveals !== null ? newReveals : revealsUsed + 1,
    };

    return res.status(200).json({ ok: true, revealed, used });
  } catch (err) {
    console.error('reveal error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
