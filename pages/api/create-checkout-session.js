// pages/api/create-checkout-session.js
// Temporary fallback/debug version: logs incoming body and supports env-based price map.
// Add to repo, commit, push, deploy. Check Vercel logs for "create-checkout-session incoming" lines.

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
      bodyPreview: JSON.stringify(req.body).slice(0, 1000)
    });

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body || {};
    let { priceId, plan, email } = body;

    if (!priceId && plan) {
      priceId = getPriceFromEnvMap(plan);
      console.log('create-checkout-session: resolved priceId from PRICE_MAP', { plan, priceId });
    }

    if (!priceId) {
      console.error('create-checkout-session: missing priceId after fallback', { body });
      return res.status(400).json({ error: 'missing priceId or email', reason: 'missing_price_or_email', received: Object.keys(body) });
    }

    if (!email) {
      console.error('create-checkout-session: missing email', { body });
      return res.status(400).json({ error: 'missing priceId or email', reason: 'missing_price_or_email', received: Object.keys(body) });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.novahunt.ai'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.novahunt.ai'}/plans`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', String(err));
    return res.status(500).json({ error: 'server_error', message: String(err?.message || err) });
  }
}
