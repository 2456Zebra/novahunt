// pages/api/create-checkout-session.js
// Accepts either { priceId } OR { plan } in the request body.
// If a plan slug is provided, it resolves that to a Stripe Price id using a map.
// You can configure the map via an environment variable PRICE_MAP as JSON string:
// PRICE_MAP='{"starter":"price_1SW1uNGyuj9BgGEUEuHiifyT","pro":"price_ABC...","team":"price_DEF..."}'

import Stripe from 'stripe';

function loadPriceMap() {
  const fromEnv = process.env.PRICE_MAP;
  if (fromEnv) {
    try {
      return JSON.parse(fromEnv);
    } catch (e) {
      console.warn('PRICE_MAP env present but invalid JSON. Ignoring.', e);
    }
  }
  // Fallback map — replace these values with your real Stripe Price IDs if you choose to edit code.
  return {
    starter: 'price_1SW1uNGyuj9BgGEUEuHiifyT',
    pro: 'price_REPLACE_WITH_PRO_PRICE_ID',   // <-- replace
    team: 'price_REPLACE_WITH_TEAM_PRICE_ID', // <-- replace
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    let { priceId, email, plan } = body;

    // If a plan slug was provided, map it to a priceId
    const priceMap = loadPriceMap();
    if (!priceId && plan && typeof plan === 'string') {
      priceId = priceMap[plan];
      if (!priceId) {
        console.warn('Unknown plan slug received:', plan);
        return res.status(400).json({ error: `Unknown plan: ${plan}` });
      }
    }

    // Validate final priceId
    if (!priceId || typeof priceId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid priceId in request body' });
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const SUCCESS_URL = process.env.SUCCESS_URL || 'https://www.novahunt.ai/checkout-success?session_id={CHECKOUT_SESSION_ID}';
    const CANCEL_URL = process.env.CANCEL_URL || 'https://www.novahunt.ai/plans';

    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured in environment');
      return res.status(500).json({ error: 'Server misconfiguration: STRIPE_SECRET_KEY missing' });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err && err.stack ? err.stack : err);
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error', message: err && err.message ? err.message : '' });
  }
}
