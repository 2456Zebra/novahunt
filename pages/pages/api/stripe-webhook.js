// Minimal Stripe webhook handler for checkout.session.completed
// Env:
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET

import Stripe from 'stripe';
import getRawBody from 'raw-body';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return res.status(500).end();
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const buf = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err && err.message);
    return res.status(400).send(`Webhook Error: ${err && err.message}`);
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // TODO: Provision the user, create subscription record, email receipt, etc.
    // Example: find user by session.customer_email and mark as subscribed
    console.log('Webhook: checkout.session.completed', { id: session.id, email: session.customer_email, mode: session.mode });
    // Idempotency: check your DB if session.id already processed.
  }

  // Return 200 to acknowledge receipt
  res.status(200).json({ received: true });
}
