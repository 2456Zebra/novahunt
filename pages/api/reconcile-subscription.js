// Reconcile subscription info for the current session or for a provided email.
// POST { email?: "user@example.com" } or include x-nh-session header.
// This will attempt to find a customer/subscription in KV, checkout mapping, or Stripe and persist stripe:subscription:{email}.
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
      if (session && session.subscription) {
        return session.subscription;
      }
      // If no subscription but we have a customer id, return customer id in a small object
      if (session && session.customer) {
        return { customer: typeof session.customer === 'string' ? session.customer : session.customer?.id || null };
      }
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
    // no subscription found, but return customer id so portal can be created
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

  try {
    let email = null;
    const body = req.body || {};
    if (body.email) email = String(body.email).toLowerCase();

    if (!email) {
      const sessionHeader = req.headers['x-nh-session'] || '';
      if (sessionHeader) {
        try {
          const parsed = JSON.parse(sessionHeader);
          email = parsed?.email || null;
        } catch (e) {
          if (typeof sessionHeader === 'string' && sessionHeader.includes('@')) email = sessionHeader;
        }
      }
    }

    if (!email) return res.status(400).json({ error: 'email required (in body or session header)' });

    const emailKey = String(email).toLowerCase();

    // 1) Try KV direct
    try {
      if (kv) {
        const existing = await kv.get(`stripe:subscription:${emailKey}`);
        if (existing && existing.id) {
          return res.status(200).json({ ok: true, source: 'kv', subscription: existing });
        }
      }
    } catch (e) {
      console.warn('KV read error', e?.message || e);
    }

    // 2) Try checkout mapping (and persist if found)
    try {
      const fromCheckout = await findSubscriptionFromCheckoutKV(emailKey);
      if (fromCheckout) {
        // normalize into storeable object
        if (fromCheckout.id || fromCheckout.customer) {
          let toStore = null;
          if (fromCheckout.id) {
            const subscription = fromCheckout;
            const priceId = (subscription.items && subscription.items.data && subscription.items.data[0]?.price?.id) || null;
            toStore = {
              id: subscription.id,
              status: subscription.status || 'unknown',
              priceId,
              raw: subscription,
              updated_at: new Date().toISOString(),
            };
          } else if (fromCheckout.customer) {
            // no subscription, but persist customer id
            const existing = (await kv.get(`stripe:subscription:${emailKey}`)) || {};
            existing.raw = existing.raw || {};
            existing.raw.customer = fromCheckout.customer;
            existing.updated_at = new Date().toISOString();
            toStore = existing;
          }

          if (toStore && kv) {
            try {
              await kv.set(`stripe:subscription:${emailKey}`, toStore, { ex: 60 * 60 * 24 * 365 });
            } catch (e) {
              console.warn('KV write failed (checkout persist)', e?.message || e);
            }
            return res.status(200).json({ ok: true, source: 'checkout_session', subscription: toStore });
          }
        }
      }
    } catch (e) {
      console.warn('checkout mapping lookup failed', e?.message || e);
    }

    // 3) Fallback: find via Stripe by email and persist
    try {
      const found = await findSubscriptionFromStripeByEmail(emailKey);
      if (found) {
        let toStore = null;
        if (found.id) {
          const subscription = found;
          const priceId = subscription.items?.data?.[0]?.price?.id || null;
          toStore = {
            id: subscription.id,
            status: subscription.status || 'unknown',
            priceId,
            raw: subscription,
            updated_at: new Date().toISOString(),
          };
        } else if (found.customer) {
          const existing = (await kv.get(`stripe:subscription:${emailKey}`)) || {};
          existing.raw = existing.raw || {};
          existing.raw.customer = found.customer;
          existing.updated_at = new Date().toISOString();
          toStore = existing;
        }

        if (toStore && kv) {
          try {
            await kv.set(`stripe:subscription:${emailKey}`, toStore, { ex: 60 * 60 * 24 * 365 });
          } catch (e) {
            console.warn('KV write failed (stripe persist)', e?.message || e);
          }
        }

        return res.status(200).json({ ok: true, source: 'stripe_subscriptions', subscription: toStore || found });
      }
    } catch (e) {
      console.warn('Stripe lookup failed in reconcile', e?.message || e);
    }

    // Nothing found
    return res.status(404).json({ ok: false, error: 'No subscription found' });
  } catch (err) {
    console.error('reconcile-subscription error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
