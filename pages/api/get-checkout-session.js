// pages/api/get-checkout-session.js
// GET ?session_id=...  -> returns { session_id, email, paid }
// Server-side only: requires STRIPE_SECRET_KEY

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session_id = req.query.session_id;
  if (!session_id) return res.status(400).json({ error: 'missing session_id' });

  try {
    // Expand subscription so you can check subscription.status for subscription plans
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription'] });

    let paid = false;
    if (session.payment_status === 'paid') paid = true;
    if (session.subscription && session.subscription.status === 'active') paid = true;

    return res.status(200).json({
      session_id: session.id,
      email: session.customer_email || null,
      paid,
    });
  } catch (err) {
    console.error('get-checkout-session error', err);
    // Make errors clearer for debugging (don't leak secrets)
    return res.status(500).json({ error: 'stripe_error', message: String(err?.message || err) });
  }
}
