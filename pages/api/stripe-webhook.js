// /pages/api/stripe-webhook.js
// Stripe webhook endpoint with signature verification.
//
// Notes:
// - bodyParser is disabled so we can validate Stripe signatures against the raw payload.
// - In production you MUST set STRIPE_SECRET and STRIPE_WEBHOOK_SECRET in your environment.
// - Replace the dev-only /tmp append with real DB updates (commented where to do so).

import fs from 'fs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET || '', { apiVersion: '2022-11-15' });

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'] || req.headers['Stripe-Signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Fail safe: Do not attempt to validate without a secret in production.
    if (process.env.NODE_ENV === 'production') {
      console.error('Stripe webhook secret is not configured in production');
      return res.status(500).json({ error: 'Webhook not configured' });
    }
  }

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error('Failed to read raw body', err);
    return res.status(500).json({ error: 'Unable to read request' });
  }

  let event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // In dev mode if secret missing, attempt a best-effort parse (NO verification)
      event = JSON.parse(rawBody.toString('utf8'));
      console.info('Webhook received without signature verification (dev only)');
    }
  } catch (err) {
    console.error('Webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const type = event.type || '';
  // Whitelist events we intend to handle
  const handledEvents = new Set([
    'checkout.session.completed',
    'payment_intent.succeeded',
    'invoice.payment_succeeded',
  ]);

  try {
    if (handledEvents.has(type)) {
      // Minimal handling: log minimal info and, in dev, append to /tmp for inspection.
      const summary = {
        id: event.id,
        type,
        created: event.created,
        // Keep only minimal info for logs: don't store full payloads in logs.
        object: event.data && event.data.object && event.data.object.id ? event.data.object.id : null,
      };

      console.info('Stripe webhook handled:', summary);

      // DEV-ONLY: append event to /tmp/stripe-events.log for debugging
      if (process.env.NODE_ENV !== 'production') {
        try {
          fs.appendFileSync('/tmp/stripe-events.log', JSON.stringify({ summary, rawId: event.id }) + '\n', { encoding: 'utf8' });
        } catch (e) {
          // Don't fail processing if logging fails
          console.warn('Could not append to /tmp/stripe-events.log', e.message || e);
        }
      }

      // TODO: Replace this block with real persistence / business logic:
      // Example:
      // if (type === 'checkout.session.completed') {
      //   const session = event.data.object;
      //   // Lookup user by session.customer_email or metadata and mark as paid/unlocked
      //   await db.users.markPaid(session.metadata.userId, { sessionId: session.id });
      // }

      return res.status(200).json({ received: true });
    } else {
      // Not one we process now; return 204 No Content
      return res.status(204).end();
    }
  } catch (err) {
    console.error('Error handling webhook event', err && err.message ? err.message : err);
    // Generic error message; do not leak secrets or payloads.
    return res.status(500).json({ error: 'Webhook handler error' });
  }
}
