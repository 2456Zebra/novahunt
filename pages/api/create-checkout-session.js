// pages/api/create-checkout-session.js
// Accepts { priceId } OR { plan } OR { productId }.
// Resolves priceId from (in order):
// 1. direct priceId in request
// 2. PRICE_MAP (env) mapping plan -> price_... OR product_...
// 3. PRODUCT_MAP (env) mapping plan -> product_...
// 4. individual env fallbacks: PRICE_<UPPER_PLAN> or PRODUCT_<UPPER_PLAN>
// If only a productId is known, it will call Stripe to find an active price (prefers recurring).
//
// Env supported:
// - STRIPE_SECRET_KEY (required)
// - PRICE_MAP (optional JSON string)
// - PRODUCT_MAP (optional JSON string)
// - PRICE_STARTER, PRICE_PRO, PRICE_TEAM (optional single price ids as env fallback)
// - PRODUCT_STARTER, PRODUCT_PRO, PRODUCT_TEAM (optional single product ids as env fallback)
// - SUCCESS_URL, CANCEL_URL
//
// The handler returns clear diagnostics in errors to make it quick to fix missing mapping issues.

import Stripe from 'stripe';

function safeParseJson(s) {
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch (e) {
    console.warn('JSON parse failed for string:', s);
    return {};
  }
}

function buildEnvFallbackMaps() {
  const priceFallback = {};
  const productFallback = {};
  // Known plan slugs — add more if you have others
  const plans = ['starter', 'pro', 'team'];
  plans.forEach((p) => {
    const up = p.toUpperCase();
    const priceEnv = process.env[`PRICE_${up}`];
    const productEnv = process.env[`PRODUCT_${up}`];
    if (priceEnv) priceFallback[p] = priceEnv;
    if (productEnv) productFallback[p] = productEnv;
  });
  return { priceFallback, productFallback };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: STRIPE_SECRET_KEY missing' });
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  // Load maps
  const priceMap = safeParseJson(process.env.PRICE_MAP);
  const productMap = safeParseJson(process.env.PRODUCT_MAP);
  const { priceFallback, productFallback } = buildEnvFallbackMaps();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    let { priceId, plan, productId, email } = body;

    // free plan short-circuit
    if (!priceId && plan === 'free') {
      return res.status(200).json({ id: null, url: '/create-account' });
    }

    // If client provided direct productId, keep it.
    // Otherwise attempt to resolve plan -> priceId or productId via maps (order matters)
    if (!priceId && plan) {
      // 1) PRICE_MAP (preferred)
      if (priceMap && priceMap[plan]) {
        const mapped = priceMap[plan];
        if (typeof mapped === 'string') {
          if (mapped.startsWith('price_')) priceId = mapped;
          else if (mapped.startsWith('prod_') || mapped.startsWith('prod-')) productId = mapped;
        }
      }

      // 2) PRODUCT_MAP (explicit product mapping)
      if (!priceId && !productId && productMap && productMap[plan]) {
        const mapped = productMap[plan];
        if (typeof mapped === 'string') productId = mapped;
      }

      // 3) individual env fallbacks PRICE_<PLAN> or PRODUCT_<PLAN>
      if (!priceId && !productId && priceFallback[plan]) priceId = priceFallback[plan];
      if (!priceId && !productId && productFallback[plan]) productId = productFallback[plan];
    }

    // If we only have a productId, resolve an active price via Stripe
    if (!priceId && productId) {
      const prices = await stripe.prices.list({ product: productId, active: true, limit: 20 });
      const recurring = prices.data.find(p => p.recurring);
      const chosen = recurring || prices.data[0];
      if (chosen && chosen.id) priceId = chosen.id;
      else {
        return res.status(400).json({
          error: 'No active price found for product',
          diagnostics: {
            productId,
            pricesFound: prices.data.length,
          },
        });
      }
    }

    // Final validation
    if (!priceId || typeof priceId !== 'string') {
      // Diagnostics to help you fix the mapping quickly
      const diagnostics = {
        received: { plan: plan || null, productId: productId || null, priceId: priceId || null },
        availableMaps: {
          PRICE_MAP_keys: Object.keys(priceMap || {}),
          PRODUCT_MAP_keys: Object.keys(productMap || {}),
          priceFallbackKeys: Object.keys(priceFallback || {}),
          productFallbackKeys: Object.keys(productFallback || {}),
          env_PRESENTS: {
            PRICE_MAP_present: !!process.env.PRICE_MAP,
            PRODUCT_MAP_present: !!process.env.PRODUCT_MAP,
            PRICE_STARTER_present: !!process.env.PRICE_STARTER,
            PRODUCT_STARTER_present: !!process.env.PRODUCT_STARTER,
          },
        },
        hint: 'Ensure PRICE_MAP or PRODUCT_MAP contains the plan key, or set PRODUCT_<PLAN> / PRICE_<PLAN> env variables; values should be exact price_... or product_... ids.',
      };
      return res.status(400).json({ error: 'Missing or invalid priceId in request body', diagnostics });
    }

    const SUCCESS_URL = process.env.SUCCESS_URL || 'https://www.novahunt.ai/checkout-success?session_id={CHECKOUT_SESSION_ID}';
    const CANCEL_URL = process.env.CANCEL_URL || 'https://www.novahunt.ai/plans';

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
