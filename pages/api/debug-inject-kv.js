// Admin debug injector for KV (protected by DEBUG_SECRET).
// POST { email: "user@example.com", subscription?: { ... } }
// If subscription not provided, this will attempt to discover via checkout mapping or Stripe and persist it.
// Returns { ok:true, stored: <object> } on success.
import Stripe from 'stripe';
import { getKV } from './_kv-wrapper';
const kv = getKV();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

async function findSubscriptionFromCheckoutKV(emailKey) {
  try {
    if (!kv) return null;
    const checkoutMap = await kv.get(`stripe:checkout:${emailKey}`);
    if (!checkoutMap || !checkoutMap.sessionId) return null;
    try {
      const session = await stripe.checkout.sessions.retrieve(checkoutMap.sessionId, { expand: ['subscription', 'customer'] });
      if (session && session.subscription) return session.subscription;
      if (session && session.customer) return { customer: typeof session.customer === 'string' ? session.customer : session.customer?.id || null };
    } catch (e) {
      console.warn('stripe checkout.sessions.retrieve failed', e?.message || e);
    }
  } catch (e) {
    console.warn('KV read error (checkout map)', e?.message || e);
  }
  return null;
}

async function findSubscriptionFromStripeByEmail(emailKey) {
  try {
    const customers = await stripe.customers.list({ email: emailKey, limit: 1 });
    if (!customers || !customers.data || customers.data.length === 0) return null;
    const customerId = customers.data[0].id;
    const subs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    if (subs && subs.data && subs.data.length > 0) {
      const active = subs.data.find(s => s.status === 'active') || subs.data[0];
      return active;
    }
    return { customer: customerId };
  } catch (e) {
    console.warn('Stripe lookup failed', e?.message || e);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const secret = req.headers['x-debug-secret'] || '';
  if (!process.env.DEBUG_SECRET) {
    return res.status(403).json({ error: 'Debug endpoint not enabled (no DEBUG_SECRET configured)' });
  }
  if (!secret || secret !== process.env.DEBUG_SECRET) {
    return res.status(401).json({ error: 'Missing or invalid debug secret' });
  }

  const { email, subscription } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required in body' });
  const emailKey = String(email).toLowerCase();

  try {
    // If subscription payload provided, use it directly
    let toStore = null;
    if (subscription && (subscription.id || subscription.raw || subscription.customer)) {
      if (subscription.id) {
        const priceId = (subscription.items && subscription.items.data && subscription.items.data[0]?.price?.id) || null;
        toStore = {
          id: subscription.id,
          status: subscription.status || 'unknown',
          priceId,
          raw: subscription,
          updated_at: new Date().toISOString(),
        };
      } else {
        // provided object contains only customer id or partial info
        const existing = (await kv.get(`stripe:subscription:${emailKey}`)) || {};
        existing.raw = subscription.raw || {};
        if (subscription.customer) existing.raw.customer = subscription.customer;
        existing.updated_at = new Date().toISOString();
        toStore = existing;
      }
    } else {
      // Try to discover subscription then persist it
      let found = null;
      found = await findSubscriptionFromCheckoutKV(emailKey);
      if (!found) found = await findSubscriptionFromStripeByEmail(emailKey);

      if (!found) {
        return res.status(404).json({ ok: false, error: 'No subscription found for email' });
      }

      if (found.id) {
        const priceId = found.items?.data?.[0]?.price?.id || null;
        toStore = {
          id: found.id,
          status: found.status || 'unknown',
          priceId,
          raw: found,
          updated_at: new Date().toISOString(),
        };
      } else if (found.customer) {
        const existing = (await kv.get(`stripe:subscription:${emailKey}`)) || {};
        existing.raw = existing.raw || {};
        existing.raw.customer = found.customer;
        existing.updated_at = new Date().toISOString();
        toStore = existing;
      }
    }

    if (!toStore) {
      return res.status(500).json({ ok: false, error: 'Could not construct subscription object to store' });
    }

    if (!kv) {
      return res.status(500).json({ ok: false, error: 'KV not available' });
    }

    try {
      await kv.set(`stripe:subscription:${emailKey}`, toStore, { ex: 60 * 60 * 24 * 365 });
    } catch (e) {
      console.error('KV write failed in injector', e?.message || e);
      return res.status(500).json({ ok: false, error: 'KV write failed', detail: String(e?.message || e) });
    }

    return res.status(200).json({ ok: true, stored: toStore });
  } catch (err) {
    console.error('debug-inject-kv error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
