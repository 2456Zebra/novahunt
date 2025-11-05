// scripts/test-stripe-webhook.js
// Manual test runner for the Stripe webhook endpoint.
// Usage: STRIPE_SECRET=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... node scripts/test-stripe-webhook.js

import fetch from 'node-fetch';
import Stripe from 'stripe';

const endpoint = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe-webhook';

async function run() {
  const stripeSecret = process.env.STRIPE_SECRET;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    console.log('Missing STRIPE_SECRET or STRIPE_WEBHOOK_SECRET. You can use the Stripe CLI instead:');
    console.log('stripe listen --forward-to http://localhost:3000/api/stripe-webhook');
    console.log('Then run: stripe trigger checkout.session.completed');
    process.exit(1);
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2022-11-15' });

  // Minimal fake event payload
  const payload = {
    id: 'evt_test_manual_' + Date.now(),
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        metadata: {},
      },
    },
  };

  const body = JSON.stringify(payload);

  // Prefer SDK helper if available
  let header;
  try {
    if (stripe.webhooks && typeof stripe.webhooks.generateTestHeaderString === 'function') {
      header = stripe.webhooks.generateTestHeaderString({
        payload: body,
        secret: webhookSecret,
        // optional: timestamp and tolerance can be set here
      });
    }
  } catch (e) {
    // ignore and fall back to Stripe CLI instructions
  }

  if (!header) {
    console.log('Stripe SDK test header helper unavailable. Use Stripe CLI instead:');
    console.log('stripe listen --forward-to http://localhost:3000/api/stripe-webhook');
    console.log('stripe trigger checkout.session.completed');
    process.exit(1);
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': header,
    },
    body,
  });

  console.log('Response status:', resp.status);
  try {
    const txt = await resp.text();
    console.log('Response body:', txt);
  } catch (e) {
    console.log('No response body');
  }
}

run().catch((err) => {
  console.error('Test script error', err);
  process.exit(2);
});
