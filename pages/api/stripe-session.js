// pages/api/stripe-session.js
// Server-side helper to fetch a Stripe Checkout Session and return the customer email.
// Requires STRIPE_SECRET_KEY in env. Only server-side; do NOT expose secret to the client.

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

    // Prefer the customer_email field (works when customer is not expanded)
    const email = session.customer_details?.email || session.customer?.email || session.customer_email || null;

    if (!email) {
      // If no email found, return 404 so client can show fallback
      return sendJson(res, 404, { error: 'email_not_found' });
    }

    // You can optionally include any other non-sensitive info the client needs
    return sendJson(res, 200, { email });
  } catch (err) {
    console.error('stripe-session error', err);
    return sendJson(res, 500, { error: 'internal' });
  }
}
