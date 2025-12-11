// pages/api/webhooks.js
// Stripe webhook handler to provision accounts on checkout.session.completed.
// Requires environment variables:
// - STRIPE_SECRET_KEY (sk_test_... or sk_live_... for API calls if needed elsewhere)
// - STRIPE_WEBHOOK_SECRET (the endpoint secret from Stripe, used to verify signatures)

import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2022-11-15' }) : null;

export const config = {
  api: {
    bodyParser: false, // Stripe requires the raw body for signature verification
  },
};

// Helper to read raw body
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  if (!webhookSecret) {
    console.error('Stripe webhook secret missing (STRIPE_WEBHOOK_SECRET). Webhook disabled.');
    return res.status(500).send('Webhook not configured');
  }

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    // Handle the event types you care about
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = (session.customer_details && session.customer_details.email) || session.customer_email || null;
        const subscriptionId = session.subscription || null;
        const customerId = session.customer || null;

        // TODO: Create or update user in your DB with email, Stripe ids, plan, etc.
        // Example (pseudo):
        // await db.users.upsert({ email: customerEmail }, { stripe_customer: customerId, stripe_subscription: subscriptionId, plan: 'Pro', active: true });

        console.log('Webhook: checkout.session.completed for', customerEmail, subscriptionId);
        // Optionally send a welcome email / perform other onboarding tasks.

        break;
      }

      case 'invoice.payment_succeeded': {
        // Optional: handle recurring payments
        const invoice = event.data.object;
        console.log('Webhook: invoice.payment_succeeded', invoice.id, invoice.customer);
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error', err);
    return res.status(500).send('Internal error');
  }
}
