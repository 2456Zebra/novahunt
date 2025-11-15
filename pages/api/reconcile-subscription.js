// Reconcile subscription info for the current session or for a provided email.
// POST { email?: "user@example.com" } or include x-nh-session header.
// This will attempt to find a customer/subscription in KV, checkout mapping, or Stripe and persist stripe:subscription:{email}.
import Stripe from 'stripe';
import { getKV } from './_kv-wrapper';
const kv = getKV();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

async function findCustomerIdByEmail(email) {
  try {
    const list = await stripe.customers.list({ email, limit: 1 });
    if (list && list.data && list.data.length > 0) return list.data[0].id;
  } catch (e) {
    console.warn('stripe customers.list failed', e?.message || e);
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
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

    const emailKey = email.toLowerCase();

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

    // 2) Try checkout mapping in KV
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
              return res.status(200).json({ ok: true, source: 'checkout_session', subscription: toStore });
            }
            if (session && session.customer) {
              // Just persist customer id so portal lookup can work
              const custId = typeof session.customer === 'string' ? session.customer : (session.customer?.id || null);
              const existing = (await kv.get(`stripe:subscription:${emailKey}`)) || {};
              existing.raw = existing.raw || {};
              existing.raw.customer = custId;
              existing.updated_at = new Date().toISOString();
              if (kv) await kv.set(`stripe:subscription:${emailKey}`, existing, { ex: 60 * 60 * 24 * 365 });
            }
          } catch (e) {
            console.warn('checkout session retrieve failed', e?.message || e);
          }
        }
      }
    } catch (e) {
      console.warn('KV read error (checkout map)', e?.message || e);
    }

    // 3) Try Stripe search: find customer by email and list subscriptions
    try {
      const customerId = await findCustomerIdByEmail(emailKey);
      if (customerId) {
        const subs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
        if (subs && subs.data && subs.data.length > 0) {
          // Choose the most relevant active subscription
          const active = subs.data.find(s => s.status === 'active') || subs.data[0];
          const priceId = active.items?.data?.[0]?.price?.id || null;
          const toStore = {
            id: active.id,
            status: active.status || 'unknown',
            priceId,
            raw: active,
            updated_at: new Date().toISOString(),
          };
          if (kv) await kv.set(`stripe:subscription:${emailKey}`, toStore, { ex: 60 * 60 * 24 * 365 });
          return res.status(200).json({ ok: true, source: 'stripe_subscriptions', subscription: toStore });
        }
      }
    } catch (e) {
      console.warn('Stripe subscriptions lookup failed', e?.message || e);
    }

    // Nothing found
    return res.status(404).json({ ok: false, error: 'No subscription found' });
  } catch (err) {
    console.error('reconcile-subscription error', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
}
