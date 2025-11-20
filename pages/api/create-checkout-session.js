// Create a Stripe Checkout session. Expects POST { priceId } and header x-nh-session containing the nh_session string.
// Returns { url } to redirect the browser to Stripe Checkout.
import Stripe from 'stripe';
import { getKV } from './_kv-wrapper';
const { validateEmail, sanitizeLogData } = require('../../lib/validation');
const kv = getKV();

// Initialize Stripe with explicit API version for consistency
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
  : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Validate request body shape
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { priceId } = req.body;
    const successEnv = process.env.SUCCESS_URL || 'https://www.novahunt.ai/checkout-success';
    const cancelEnv = process.env.CANCEL_URL || 'https://www.novahunt.ai/checkout-cancel';

    if (!priceId || typeof priceId !== 'string') {
      return res.status(400).json({ error: 'priceId required in request body' });
    }

    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
    }

    // Ensure the success_url contains the Stripe placeholder so Stripe appends the session id on redirect
    let successUrl = successEnv;
    if (!successUrl.includes('{CHECKOUT_SESSION_ID}')) {
      // Add the placeholder safely (handle existing querystring)
      const sep = successUrl.includes('?') ? '&' : '?';
      successUrl = `${successUrl}${sep}session_id={CHECKOUT_SESSION_ID}`;
    }

    const cancelUrl = cancelEnv;

    // Determine email from local session header (the client sends nh_session JSON string as header)
    let sessionHeader = req.headers['x-nh-session'] || null;
    let email = null;
    
    if (sessionHeader) {
      try {
        const parsed = JSON.parse(sessionHeader);
        email = parsed?.email || null;
      } catch (e) {
        if (typeof sessionHeader === 'string' && sessionHeader.includes('@')) {
          email = sessionHeader;
        }
      }
    }

    // Validate email if provided
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        // Don't fail the request, just clear the invalid email
        email = null;
      } else {
        email = emailValidation.normalized;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      customer_email: email || undefined,
      metadata: {
        nh_session: sessionHeader || '',
      },
    });

    try {
      if (kv && email) {
        // save a short-lived mapping to help correlate checkout -> email if needed
        await kv.set(`stripe:checkout:${session.id}`, { email, created_at: new Date().toISOString() }, { ex: 60 * 60 * 6 });
      }
    } catch (e) {
      console.warn('KV write error (checkout mapping)', e?.message || e);
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    const sanitized = sanitizeLogData('create-checkout-session error', { 
      priceId: req.body?.priceId,
      error: err?.message 
    });
    console.error(sanitized);
    // Surface Stripe error text where available
    return res.status(500).json({ error: err?.message || 'Server error' });
  }
}
