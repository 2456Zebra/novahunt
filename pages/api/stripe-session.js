// pages/api/stripe-session.js
// Server endpoint to safely fetch Stripe Checkout Session details and return non-sensitive fields (customer email).
// Requires STRIPE_SECRET_KEY.

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

function sendJson(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  const sessionId = req.method === 'GET' ? req.query.session_id : req.body?.session_id;
  if (!sessionId) return sendJson(res, 400, { error: 'missing session_id' });
  if (!STRIPE_SECRET_KEY) return sendJson(res, 501, { error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' });

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer'] });

    const email = session.customer_details?.email || session.customer?.email || session.customer_email || null;
    if (!email) return sendJson(res, 404, { error: 'email_not_found' });

    return sendJson(res, 200, { email });
  } catch (err) {
    console.error('stripe-session error', err);
    return sendJson(res, 500, { error: 'internal' });
  }
}
