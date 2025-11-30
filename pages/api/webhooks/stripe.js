/**
 * Stripe Webhook Handler
 * Handles incoming Stripe webhook events with signature verification.
 * 
 * Requires STRIPE_WEBHOOK_SECRET environment variable for signature verification.
 */
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

export const config = {
  api: {
    bodyParser: false, // Raw body required for signature verification
  },
};

/**
 * Read raw request body as Buffer
 */
async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[webhooks/stripe] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  // Handle specific event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('[webhooks/stripe] checkout.session.completed:', session.id);
      // TODO: Provision access, update database, send confirmation email, etc.
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      console.log('[webhooks/stripe] invoice.payment_succeeded:', invoice.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      console.log('[webhooks/stripe] customer.subscription.deleted:', subscription.id);
      // TODO: Revoke access, update database, etc.
      break;
    }
    default:
      console.log('[webhooks/stripe] Unhandled event type:', event.type);
  }

  // Acknowledge receipt
  return res.status(200).json({ received: true });
}
