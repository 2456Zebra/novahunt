// pages/api/create-checkout-session.js
// Creates a Stripe Checkout session for the requested plan and returns the hosted session URL.
// Uses server-side PRICE_ID_* env vars and STRIPE_SECRET_KEY.

const querystring = require('querystring');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const { plan } = req.body || {};
    if (!plan) return res.status(400).json({ ok: false, error: 'Missing plan' });

    const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
    if (!stripeKey) return res.status(500).json({ ok: false, error: 'Stripe secret key not configured' });

    // Map plan -> PRICE_ID env var. Use server-side PRICE_ID_* variables.
    const prices = {
      starter: process.env.PRICE_ID_STARTER_MONTHLY || process.env.NEXT_PUBLIC_PRICE_ID_STARTER_MONTHLY,
      pro: process.env.PRICE_ID_PRO_MONTHLY || process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY,
      team: process.env.PRICE_ID_TEAM_MONTHLY || process.env.NEXT_PUBLIC_PRICE_ID_TEAM_MONTHLY
    };

    const price = prices[plan];
    if (!price) return res.status(400).json({ ok: false, error: 'Unknown plan' });

    // success/cancel urls from env (fall back to site root)
    const successUrl = (process.env.SUCCESS_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') || '';
    const cancelUrl = (process.env.CANCEL_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') || '';

    // Build Stripe Checkout Session via HTTP API (no stripe package required)
    const body = {
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin || ''}/?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.origin || ''}/?checkout=cancel`,
      'line_items[0][price]': price,
      'line_items[0][quantity]': 1,
      allow_promotion_codes: true
    };

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify(body)
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('create-checkout-session failed', { status: resp.status, body: data });
      return res.status(500).json({ ok: false, error: 'Could not create checkout session' });
    }

    // Stripe returns session.url (hosted page). Return it to the client.
    return res.status(200).json({ ok: true, url: data.url, sessionId: data.id });
  } catch (err) {
    console.error('create-checkout-session error', err && err.message ? err.message : err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}
