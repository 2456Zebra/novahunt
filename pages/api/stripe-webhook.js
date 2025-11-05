// /pages/api/stripe-webhook.js
// Next API route: handles POST only, verifies Stripe webhook signatures

import Stripe from 'stripe';
import { promises as fs } from 'fs';

// Disable body parsing to read raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read raw body as buffer
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Whitelisted event types we want to process
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'invoice.payment_succeeded',
];

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the Stripe signature header
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Validate required environment variables
  if (!process.env.STRIPE_SECRET) {
    console.error('STRIPE_SECRET environment variable is not set');
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    return res.status(500).json({ error: 'Internal server error' });
  }

  try {
    // Read the raw body
    const rawBody = await getRawBody(req);

    // Initialize Stripe with API version
    const stripe = new Stripe(process.env.STRIPE_SECRET, { 
      apiVersion: '2022-11-15' 
    });

    // Verify the webhook signature and construct the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      // Signature verification failed
      console.error('Webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if this is a whitelisted event type
    if (HANDLED_EVENTS.includes(event.type)) {
      // Log minimal info about the event
      console.info(`Processing webhook event: ${event.type}, id: ${event.id}`);

      // TODO: Add database update logic here
      // Example: await updateUserSubscription(event.data.object);

      // Dev-only: write to file for debugging
      // NOTE: /tmp logging is for local development only. Replace with proper
      // database persistence before deploying to production. Some hosting
      // environments may not have /tmp available or may have ephemeral file systems.
      if (process.env.NODE_ENV !== 'production') {
        const logEntry = JSON.stringify({
          timestamp: new Date().toISOString(),
          type: event.type,
          id: event.id,
          // Include minimal data for debugging
          data: {
            id: event.data.object.id,
            status: event.data.object.status,
          },
        });

        try {
          await fs.appendFile('/tmp/stripe-events.log', logEntry + '\n');
        } catch (logErr) {
          // Non-critical: log file write failure shouldn't fail the webhook
          console.warn('Failed to write to dev log file:', logErr.message);
        }
      }

      // Return 200 for successfully handled events
      return res.status(200).json({ received: true });
    } else {
      // Return 204 for unhandled event types (still verified but not processed)
      return res.status(204).end();
    }
  } catch (err) {
    // Generic error handling - don't leak sensitive information
    console.error('Webhook processing error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
