// pages/api/create-checkout-session.js
// Accepts { priceId | plan, email? }
// - Logs incoming body for debugging
// - Resolves plan -> price via PRICE_MAP env var if needed
// - Makes email optional (Stripe will collect it during Checkout if absent)

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

function getPriceFromEnvMap(planOrPriceId) {
  const mapJson = process.env.PRICE_MAP || '{}';
  try {
    const map = JSON.parse(mapJson);
    return map[planOrPriceId] || null;
  } catch (e) {
    console.error('PRICE_MAP parse error', e);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    console.log('create-checkout-session incoming', {
      method: req.method,
      contentType: req.headers['content-type'],
      bodyPreview: JSON.stringify(req.body).slice(0, 2000)
    });

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body || {};
    let { priceId, plan, email } = body;

    // Resolve via PRICE_MAP if plan was passed
    if (!priceId && plan) {
      priceId = getPriceFromEnvMap(plan);
      console.log('resolved priceId from PRICE_MAP', { plan, priceId });
    }

    if (!priceId) {
      console.error('create-checkout-session: missing priceId', { body });
      return res.status(400).json({ error: 'missing priceId', reason: 'missing_priceId', received: Object.keys(body) });
    }

    // Build session params; make customer_email optional
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription', // change to 'payment' if you're doing one-offs
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.novahunt.ai'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.novahunt.ai'}/plans`,
    };
    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', String(err));
    return res.status(500).json({ error: 'server_error', message: String(err?.message || err) });
  }
}
