// pages/api/get-checkout-session.js
// GET ?session_id=... -> returns { session_id, email, paid }
// Requires STRIPE_SECRET_KEY in Vercel Production envs.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session_id = req.query.session_id;
  if (!session_id) return res.status(400).json({ error: 'missing session_id' });

  try {
    // Expand customer & subscription so we can inspect email and subscription status
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription', 'customer'] });

    let paid = false;
    if (session.payment_status === 'paid') paid = true;
    if (session.subscription && session.subscription.status === 'active') paid = true;

    const email = session.customer_email || (session.customer && session.customer.email) || null;

    return res.status(200).json({
      session_id: session.id,
      email,
      paid,
    });
  } catch (err) {
    console.error('get-checkout-session error', err?.message || err);
    const msg = String(err?.message || err);
    if (msg.toLowerCase().includes('no such checkout.session')) {
      return res.status(404).json({ error: 'not_found', message: msg });
    }
    return res.status(500).json({ error: 'stripe_error', message: msg });
  }
}
