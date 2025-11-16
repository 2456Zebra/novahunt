// Reveal endpoint — enforces auth, plan limits, and increments usage counters.
// Expected: POST { contactId?: string, other payload... } and x-nh-session header containing { email } JSON.
// Returns { ok:true, revealed: { ... }, used: { reveals, searches } } or appropriate errors.
import { getKV } from './_kv-wrapper';
const kv = getKV();

// Plan limits: keep in sync with account-usage
const PLAN_LIMITS = {
  free: { searches: 5, reveals: 2 },
  starter: { searches: 500, reveals: 100 },
  pro: { searches: 2000, reveals: 500 },
  team: { searches: 10000, reveals: 2000 },
};

// Used to map priceId -> plan string if needed; keep values in env or logic in reconcile/account-usage
function safeParseSession(header) {
  if (!header) return null;
  try {
    return JSON.parse(header);
  } catch (e) {
    // header may already be an email string
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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sessionHeader = req.headers['x-nh-session'] || '';
    const parsed = safeParseSession(sessionHeader);
    const email = parsed?.email || null;
    if (!email) {
      return res.status(401).json({ ok: false, error: 'Authentication required to reveal' });
    }
    const emailKey = String(email).toLowerCase();

    // read subscription from KV (fallbacks in account-usage will populate if missing)
    let subscription = null;
    try {
      if (kv) subscription = await kv.get(`stripe:subscription:${emailKey}`);
    } catch (e) {
      console.warn('KV read error (reveal subscription)', e?.message || e);
    }

    // If no subscription in KV, still allow account-usage fallback but assume free
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

    // Perform the actual reveal logic here.
    // If you already have existing reveal logic (calls to Hunter), call into it.
    // For safety, we'll assume an existing function doReveal(payload) exists — otherwise keep your current logic.
    let revealed = null;
    try {
      // If you have a helper: revealed = await doReveal(req.body);
      // For now, if original reveal code exists elsewhere, import and call it.
      // Fallback: emulate a reveal result using request payload for testing
      revealed = { message: 'Revealed (placeholder)', payload: req.body };
    } catch (e) {
      console.error('Reveal provider error', e?.message || e);
      return res.status(500).json({ ok: false, error: 'Reveal provider error' });
    }

    // Increment the reveals counter atomically
    let newReveals = null;
    try {
      if (kv && typeof kv.incr === 'function') {
        // use incr to get new numeric value
        newReveals = await kv.incr(`usage:reveals:${emailKey}`, 1);
      } else if (kv) {
        // fallback read/parse/set
        const cur = await kv.get(`usage:reveals:${emailKey}`);
        const n = parseInt(cur || '0', 10) || 0;
        newReveals = n + 1;
        await kv.set(`usage:reveals:${emailKey}`, String(newReveals));
      }
    } catch (e) {
      console.warn('KV increment error (reveals)', e?.message || e);
    }

    // Return reveal result and updated usage info
    const used = {
      reveals: newReveals !== null ? newReveals : revealsUsed + 1,
    };

    // Emit nothing from server — client should re-fetch account-usage.
    return res.status(200).json({ ok: true, revealed, used });
  } catch (err) {
    console.error('reveal error', err?.message || err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
