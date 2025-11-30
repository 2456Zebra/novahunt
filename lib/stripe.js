import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required.');
}

const stripe = new Stripe(stripeSecret, { apiVersion: '2023-08-16' });

export default stripe;
