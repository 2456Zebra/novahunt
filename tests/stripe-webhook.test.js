// tests/stripe-webhook.test.js
// Basic integration test for Stripe webhook endpoint
// This test is skipped if STRIPE_WEBHOOK_SECRET is not set

const crypto = require('crypto');

/**
 * Generate a test Stripe webhook signature
 * @param {object|string} payload - Webhook payload object or JSON string
 * @param {string} secret - Webhook signing secret
 * @returns {string} Stripe signature header value
 */
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Create a test webhook event payload
 */
function createTestEvent(eventType = 'checkout.session.completed') {
  return {
    id: `evt_test_${crypto.randomBytes(12).toString('hex')}`,
    object: 'event',
    api_version: '2022-11-15',
    created: Math.floor(Date.now() / 1000),
    type: eventType,
    data: {
      object: {
        id: `cs_test_${crypto.randomBytes(12).toString('hex')}`,
        object: 'checkout.session',
        status: 'complete',
        customer_email: 'test@example.com',
        amount_total: 1000,
        currency: 'usd',
      },
    },
  };
}

describe('Stripe Webhook Endpoint', () => {
  // Skip all tests if STRIPE_WEBHOOK_SECRET is not set
  const skipTests = !process.env.STRIPE_WEBHOOK_SECRET;
  
  if (skipTests) {
    console.warn('⚠️  Skipping Stripe webhook tests: STRIPE_WEBHOOK_SECRET not set');
    console.warn('   Set STRIPE_WEBHOOK_SECRET=whsec_test_... to run these tests');
  }

  const conditionalTest = skipTests ? test.skip : test;

  conditionalTest('should reject requests without stripe-signature header', async () => {
    const event = createTestEvent();
    const payload = JSON.stringify(event);

    const response = await fetch('http://localhost:3000/api/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('stripe-signature');
  });

  conditionalTest('should reject requests with invalid signature', async () => {
    const event = createTestEvent();
    const payload = JSON.stringify(event);
    const invalidSignature = 't=1234567890,v1=invalid_signature';

    const response = await fetch('http://localhost:3000/api/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': invalidSignature,
      },
      body: payload,
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('signature');
  });

  conditionalTest('should accept requests with valid signature for handled events', async () => {
    const event = createTestEvent('checkout.session.completed');
    const payload = JSON.stringify(event);
    const signature = generateStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

    const response = await fetch('http://localhost:3000/api/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.received).toBe(true);
  });

  conditionalTest('should return 204 for unhandled event types', async () => {
    const event = createTestEvent('customer.created');
    const payload = JSON.stringify(event);
    const signature = generateStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

    const response = await fetch('http://localhost:3000/api/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
      },
      body: payload,
    });

    expect(response.status).toBe(204);
  });

  conditionalTest('should reject non-POST requests', async () => {
    const response = await fetch('http://localhost:3000/api/stripe-webhook', {
      method: 'GET',
    });

    expect(response.status).toBe(405);
  });
});

// Export functions for use in other scripts
module.exports = {
  generateStripeSignature,
  createTestEvent,
};
