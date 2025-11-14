// Lightweight proxy so Stripe can call /api/stripe-webhook while the main handler lives in /api/webhook.js
// If you already pointed Stripe at /api/webhook, you can delete this file.
import webhookHandler from './webhook';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // delegate to the existing webhook handler
  return webhookHandler(req, res);
}
