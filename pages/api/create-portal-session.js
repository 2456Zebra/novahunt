// Create a Stripe Customer Portal session. Improved: will attempt to find customer via KV, checkout mapping, or Stripe by email.
import Stripe from 'stripe';
import { getKV } from './_kv-wrapper';
const kv = getKV();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Determine email from header or cookie
    let sessionHeader = req.headers['x-nh-session'] || null;
    let email = null;
    if (sessionHeader) {
      try {
        const parsed = JSON.parse(sessionHeader);
        email = parsed?.email || null;
      } catch (e) {
        if (typeof sessionHeader === 'string' && sessionHeader.includes('@')) email = sessionHeader;
      }
    } else if (req.cookies && req.cookies.nh_session) {
      try {
        const parsed = JSON.parse(decodeURIComponent(req.cookies.nh_session));
        email = parsed?.email || null;
      } catch (e) {}
    }

    if (!email) return res.status(401).json({ error: 'Not signed in' });
    const emailKey = String(email).toLowerCase();

    // Try KV: stripe:subscription:{email}
    let subscription = null;
    try {
      if (kv) subscription = await kv.get(`stripe:subscription:${emailKey}`);
    } catch (e) {
      console.warn('KV read error (portal subscription)', e?.message || e);
    }

    let customerId = subscription?.raw?.customer || null;

    // Try checkout mapping if we don't have a customer
    if (!customerId) {
      try {
        const checkoutMap = await kv.get(`stripe:checkout:${emailKey}`);
        if (checkoutMap && checkoutMap.sessionId) {
          const session = await stripe.checkout.sessions.retrieve(checkoutMap.sessionId);
          if (session && session.customer) customerId = typeof session.customer === 'string' ? session.customer : (session.customer?.id || null);
        }
      } catch (e) {
        console.warn('checkout mapping lookup failed', e?.message || e);
      }
    }

    // Try finding a customer by email directly in Stripe as a fallback
    if (!customerId) {
      try {
        const customers = await stripe.customers.list({ email: emailKey, limit: 1 });
        if (customers && customers.data && customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      } catch (e) {
        console.warn('Stripe customer lookup failed', e?.message || e);
      }
    }

    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer found for account' });
    }

    const returnUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.novahunt.ai/';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error('create-portal-session error', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
