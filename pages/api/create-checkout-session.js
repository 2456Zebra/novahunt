// pages/api/create-checkout-session.js
// Example using stripe npm package to create a checkout session server-side.
// Ensure you have SUCCESS_URL envvar set to include {CHECKOUT_SESSION_ID}.

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { priceId, email } = req.body || {}; // adapt to your front-end payload
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // or 'payment' depending on your plan
      line_items: [
        { price: priceId, quantity: 1 }
      ],
      customer_email: email || undefined,
      success_url: process.env.SUCCESS_URL, // must contain {CHECKOUT_SESSION_ID} placeholder in env
      cancel_url: process.env.CANCEL_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.novahunt.ai'}/plans`,
    });

    // Return session id/url to client
    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return res.status(500).send('Server error');
  }
}
