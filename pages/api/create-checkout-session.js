// pages/api/create-checkout-session.js
// Accepts { priceId } OR { plan } OR { productId }.
// If given productId, it auto-resolves an active price for that product using the Stripe API.
// If plan === 'free' returns a frontend signup url (no Stripe session).
//
// Env used:
// - STRIPE_SECRET_KEY
// - PRICE_MAP (optional JSON mapping of plan slug -> priceId or productId)
// - SUCCESS_URL (contains {CHECKOUT_SESSION_ID})
// - CANCEL_URL

import Stripe from 'stripe';

function loadPriceMap() {
  const fromEnv = process.env.PRICE_MAP;
  if (!fromEnv) return {};
  try {
    return JSON.parse(fromEnv);
  } catch (e) {
    console.warn('PRICE_MAP env present but invalid JSON. Ignoring.', e);
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    let { priceId, email, plan, productId } = body;

    // Quick free plan short-circuit
    if (!priceId && plan === 'free') {
      // Return frontend signup URL (no Stripe session)
      return res.status(200).json({ id: null, url: '/create-account' });
    }

    // Resolve plan slug -> priceId or productId via PRICE_MAP
    const priceMap = loadPriceMap();
    if (plan && priceMap[plan]) {
      const mapped = priceMap[plan];
      // allow mapping to either a price_... or a product_...
      if (mapped.startsWith('price_')) priceId = mapped;
      else if (mapped.startsWith('prod_') || mapped.startsWith('prod-')) productId = mapped;
    }

    // If productId provided but no priceId, use Stripe to find an active price
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY missing');
      return res.status(500).json({ error: 'Server misconfiguration: STRIPE_SECRET_KEY missing' });
    }
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

    if (!priceId && productId) {
      // Find an active price for the product (prefer recurring/subscription prices)
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 10,
      });
      // Try to find recurring price first, otherwise any price
      const recurring = prices.data.find(p => p.recurring);
      const chosen = recurring || prices.data[0];
      if (chosen) priceId = chosen.id;
      else {
        console.warn('No active price found for productId', productId);
        return res.status(400).json({ error: `No active price found for product ${productId}` });
      }
    }

    if (!priceId || typeof priceId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid priceId in request body' });
    }

    const SUCCESS_URL = process.env.SUCCESS_URL || 'https://www.novahunt.ai/checkout-success?session_id={CHECKOUT_SESSION_ID}';
    const CANCEL_URL = process.env.CANCEL_URL || 'https://www.novahunt.ai/plans';

    // Create Stripe Checkout Session (subscription mode)
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
    if (err && err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    return res.status(500).json({ error: 'Internal server error', message: err && err.message ? err.message : '' });
  }
}
