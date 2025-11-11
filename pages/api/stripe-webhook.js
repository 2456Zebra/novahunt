// pages/api/stripe-webhook.js
import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerId = session.customer;
      const email = session.customer_details?.email;

      // Store PRO user in memory (for demo) or KV later
      global.proUsers = global.proUsers || new Map();
      global.proUsers.set(customerId, {
        email,
        isPro: true,
        plan: 'pro',
        updatedAt: new Date().toISOString(),
      });

      console.log(`PRO activated for ${email} (${customerId})`);
      break;
    }

    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      if (global.proUsers?.has(customerId)) {
        global.proUsers.delete(customerId);
        console.log(`PRO revoked for ${customerId}`);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}
