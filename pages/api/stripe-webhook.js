// Minimal Stripe webhook endpoint: do NOT redirect. Return 2xx quickly.
// If you validate signatures, set STRIPE_WEBHOOK_SECRET in Vercel env.
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: { bodyParser: false }, // raw body required for signature verification
};

async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const raw = await buffer(req);

    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      // Verify signature when secret provided
      event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // No signature secret configured: fall back to parsing JSON (less secure)
      event = JSON.parse(raw.toString('utf8'));
    }

    // Handle events quickly and idempotently
    switch (event.type) {
      case 'checkout.session.completed':
        console.info('[webhook] checkout.session.completed', event.data.object.id);
        break;
      case 'invoice.payment_succeeded':
        console.info('[webhook] invoice.payment_succeeded', event.data.object.id);
        break;
      default:
        console.info('[webhook] unhandled event type', event.type);
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] error', err && err.message ? err.message : err);
    res.status(400).send(`Webhook error: ${err && err.message ? err.message : 'unknown'}`);
  }
}
