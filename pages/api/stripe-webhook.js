// Lightweight proxy so Stripe can call /api/stripe-webhook while the main handler lives in /api/webhook.js
import webhookHandler from './webhook';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  return webhookHandler(req, res);
}
