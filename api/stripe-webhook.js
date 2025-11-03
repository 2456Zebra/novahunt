import Stripe from 'stripe';
import getRawBody from 'raw-body';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'] || req.headers['Stripe-Signature'];
  let raw;
  try {
    raw = await getRawBody(req);
  } catch (err) {
    console.error('Failed to read raw body:', err);
    return res.status(400).end('Invalid request body');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the events you want to react to
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // TODO: link session.customer_email or session.metadata to your user record and mark as Pro
      console.log('Checkout session completed:', session.id, session.customer_email);
      break;
    }
    case 'invoice.payment_succeeded':
      console.log('Invoice paid:', event.data.object.id);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      console.log('Subscription event:', event.type, event.data.object.id);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }

  res.status(200).json({ received: true });
}