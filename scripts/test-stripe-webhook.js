#!/usr/bin/env node
// scripts/test-stripe-webhook.js
// Manual test script for Stripe webhook endpoint
// Run with: node scripts/test-stripe-webhook.js

const crypto = require('crypto');
const http = require('http');

// Check for required environment variables
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.error('Error: STRIPE_WEBHOOK_SECRET environment variable is required');
  console.error('Set it with: export STRIPE_WEBHOOK_SECRET=whsec_test_...');
  process.exit(1);
}

// Configuration
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/stripe-webhook';
const HOST = new URL(WEBHOOK_URL).hostname;
const PORT = new URL(WEBHOOK_URL).port || (new URL(WEBHOOK_URL).protocol === 'https:' ? 443 : 80);
const PATH = new URL(WEBHOOK_URL).pathname;

// Sample webhook event payload
const createTestEvent = (eventType = 'checkout.session.completed') => {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    id: `evt_test_${crypto.randomBytes(12).toString('hex')}`,
    object: 'event',
    api_version: '2022-11-15',
    created: timestamp,
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
};

// Generate Stripe signature
function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return {
    signature: `t=${timestamp},v1=${signature}`,
    payload: payloadString,
  };
}

// Send test webhook request
async function sendTestWebhook(eventType) {
  return new Promise((resolve, reject) => {
    const testEvent = createTestEvent(eventType);
    const { signature, payload } = generateStripeSignature(testEvent, WEBHOOK_SECRET);

    const options = {
      hostname: HOST,
      port: PORT,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Main test runner
async function runTests() {
  console.log('🧪 Testing Stripe Webhook Endpoint');
  console.log('==================================\n');
  console.log(`Target: ${WEBHOOK_URL}`);
  console.log(`Secret: ${WEBHOOK_SECRET.substring(0, 15)}...\n`);

  const testCases = [
    { name: 'checkout.session.completed', type: 'checkout.session.completed', expectedStatus: 200 },
    { name: 'payment_intent.succeeded', type: 'payment_intent.succeeded', expectedStatus: 200 },
    { name: 'invoice.payment_succeeded', type: 'invoice.payment_succeeded', expectedStatus: 200 },
    { name: 'customer.created (unhandled)', type: 'customer.created', expectedStatus: 204 },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}...`);
      const response = await sendTestWebhook(testCase.type);
      
      if (response.statusCode === testCase.expectedStatus) {
        console.log(`✅ PASS - Status: ${response.statusCode}`);
        passed++;
      } else {
        console.log(`❌ FAIL - Expected ${testCase.expectedStatus}, got ${response.statusCode}`);
        console.log(`   Response: ${response.body}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('\n==================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('==================================\n');

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Check the endpoint is running and configured correctly.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
