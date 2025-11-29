// pages/api/stripe-webhook.js
// Minimal Stripe webhook handler that does NOT require "raw-body" dependency.
// It reads the raw request body using native streams and verifies the signature.
//
// Env:
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET

import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('Webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return res.status(500).end('Server misconfiguration');
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  let buf;
  try {
    buf = await getRawBody(req);
  } catch (err) {
    console.error('Webhook: error reading raw body', err);
    return res.status(400).end('Error reading request body');
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.error('Webhook: missing stripe-signature header');
    return res.status(400).end('Missing signature');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err && err.message);
    return res.status(400).send(`Webhook Error: ${err && err.message}`);
  }

  // Handle events
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // TODO: Provision the user, create subscription record, email receipt, etc.
      // Ensure idempotency: check DB if session.id already processed.
      console.log('Webhook: checkout.session.completed', {
        id: session.id,
        email: session.customer_email,
        mode: session.mode,
        subscription: session.subscription || null,
      });
    } else {
      console.log('Webhook: unhandled event type', event.type);
    }
  } catch (err) {
    console.error('Webhook processing error', err);
  }

  res.status(200).json({ received: true });
}
