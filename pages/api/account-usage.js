// Returns usage counts and plan limits for the signed-in local user (from x-nh-session header).
// If KV does not contain stripe:subscription:{email}, this endpoint will attempt to find a subscription
// by checking a checkout mapping, or by querying Stripe for a customer by email and their subscriptions.
// If a subscription is found it will be persisted to KV (stripe:subscription:{email}) so subsequent calls are fast.
import Stripe from 'stripe';
import { getKV } from './_kv-wrapper';
const kv = getKV();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

function planFromPriceId(priceId) {
  if (!priceId) return 'free';
  if (process.env.PRICE_ID_STARTER_MONTHLY && priceId === process.env.PRICE_ID_STARTER_MONTHLY) return 'starter';
  if (process.env.PRICE_ID_PRO_MONTHLY && priceId === process.env.PRICE_ID_PRO_MONTHLY) return 'pro';
  if (process.env.PRICE_ID_TEAM_MONTHLY && priceId === process.env.PRICE_ID_TEAM_MONTHLY) return 'team';
  // Also handle env var variants without _MONTHLY
  if (process.env.NEXT_PUBLIC_PRICE_ID_STARTER_MONTHLY && priceId === process.env.NEXT_PUBLIC_PRICE_ID_STARTER_MONTHLY) return 'starter';
  if (process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY && priceId === process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY) return 'pro';
  if (process.env.NEXT_PUBLIC_PRICE_ID_TEAM_MONTHLY && priceId === process.env.NEXT_PUBLIC_PRICE_ID_TEAM_MONTHLY) return 'team';
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

async function findAndPersistSubscription(emailKey) {
  // Try checkout mapping in KV
  try {
    if (kv) {
      const checkoutMap = await kv.get(`stripe:checkout:${emailKey}`);
      if (checkoutMap && checkoutMap.sessionId) {
        try {
          const session = await stripe.checkout.sessions.retrieve(checkoutMap.sessionId, { expand: ['subscription', 'customer'] });
          if (session && session.subscription) {
            const subscription = session.subscription;
            const priceId = (subscription.items && subscription.items.data && subscription.items.data[0]?.price?.id) || null;
            const toStore = {
              id: subscription.id,
              status: subscription.status || 'unknown',
              priceId,
              raw: subscription,
              updated_at: new Date().toISOString(),
            };
            if (kv) await kv.set(`stripe:subscription:${emailKey}`, toStore, { ex: 60 * 60 * 24 * 365 });
            return toStore;
          }
          if (session && session.customer) {
            const cust = typeof session.customer === 'string' ? session.customer : (session.customer?.id || null);
            const existing = (await kv.get(`stripe:subscription:${emailKey}`)) || {};
            existing.raw = existing.raw || {};
            existing.raw.customer = cust;
            existing.updated_at = new Date().toISOString();
            if (kv) await kv.set(`stripe:subscription:${emailKey}`, existing, { ex: 60 * 60 * 24 * 365 });
          }
        } catch (e) {
          console.warn('checkout session retrieve failed in findAndPersistSubscription', e?.message || e);
        }
      }
    }
  } catch (e) {
    console.warn('KV read error (checkout map) in findAndPersistSubscription', e?.message || e);
  }

  // Fallback: find a Stripe customer by email and list subscriptions
  try {
    const customers = await stripe.customers.list({ email: emailKey, limit: 1 });
    if (customers && customers.data && customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
      if (subs && subs.data && subs.data.length > 0) {
        const active = subs.data.find(s => s.status === 'active') || subs.data[0];
        const priceId = active.items?.data?.[0]?.price?.id || null;
        const toStore = {
          id: active.id,
          status: active.status || 'unknown',
          priceId,
          raw: active,
          updated_at: new Date().toISOString(),
        };
        if (kv) {
          try {
            await kv.set(`stripe:subscription:${emailKey}`, toStore, { ex: 60 * 60 * 24 * 365 });
          } catch (e) {
            console.warn('KV write error while persisting subscription (account-usage fallback)', e?.message || e);
          }
        }
        return toStore;
      }
    }
  } catch (e) {
    console.warn('Stripe customers/subscriptions lookup failed in findAndPersistSubscription', e?.message || e);
  }

  return null;
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
      // anonymous view: return free limits and zero usage
      return res.status(200).json({ subscribed: false, plan: 'free', limits: PLAN_LIMITS.free, used: { searches: 0, reveals: 0 }, subscription: null });
    }

    const emailKey = String(email).toLowerCase();

    // read subscription from KV
    let subscription = null;
    try {
      if (kv) subscription = await kv.get(`stripe:subscription:${emailKey}`);
    } catch (e) {
      console.warn('KV read error (account-usage subscription)', e?.message || e);
    }

    // If no subscription in KV, attempt to find one and persist it
    if (!subscription) {
      try {
        subscription = await findAndPersistSubscription(emailKey);
      } catch (e) {
        console.warn('findAndPersistSubscription error', e?.message || e);
      }
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
