# Stripe Webhook Setup and Testing

This document describes how to configure and test the Stripe webhook endpoint for NovaHunt.

## Overview

The webhook endpoint at `/api/stripe-webhook` handles incoming webhook events from Stripe. It:
- Verifies webhook signatures using `STRIPE_WEBHOOK_SECRET`
- Processes whitelisted events: `checkout.session.completed`, `payment_intent.succeeded`, `invoice.payment_succeeded`
- Logs events to `/tmp/stripe-events.log` in non-production environments
- Returns appropriate status codes (200 for handled, 204 for unhandled, 4xx/5xx for errors)

## Configuration

### Environment Variables

You need to configure two Stripe-related environment variables:

1. **STRIPE_SECRET**: Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
2. **STRIPE_WEBHOOK_SECRET**: Your webhook signing secret (starts with `whsec_`)

### Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - **Name**: `STRIPE_SECRET`
     - **Value**: `sk_test_...` (or `sk_live_...` for production)
     - **Environments**: Select appropriate environment(s)
   - **Name**: `STRIPE_WEBHOOK_SECRET`
     - **Value**: `whsec_...`
     - **Environments**: Select appropriate environment(s)
4. Redeploy your application for changes to take effect

### Getting Your Webhook Secret

#### Option 1: Stripe Dashboard (Production)

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Set the endpoint URL to: `https://yourdomain.com/api/stripe-webhook`
5. Select the events you want to receive:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded`
6. Click **Add endpoint**
7. Click **Reveal** next to "Signing secret" to get your `whsec_...` key

#### Option 2: Stripe CLI (Local Testing)

For local development, use the Stripe CLI to forward webhook events:

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli#install
2. Log in: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```
4. The CLI will display a webhook signing secret (starts with `whsec_`) - use this for local testing
5. Keep the CLI running while testing

## Testing

### Manual Test Script

We provide a Node.js script to test the webhook endpoint locally:

1. Set your webhook secret:
   ```bash
   export STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

2. Make sure your Next.js development server is running:
   ```bash
   npm run dev
   # or
   vercel dev
   ```

3. Run the test script:
   ```bash
   node scripts/test-stripe-webhook.js
   ```

The script will:
- Send test webhook events with valid signatures
- Test both handled and unhandled event types
- Verify the endpoint returns correct status codes
- Display pass/fail results

### Testing with Stripe CLI

To test with real Stripe events in development:

1. Start your local server:
   ```bash
   npm run dev
   ```

2. In another terminal, start the Stripe CLI listener:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

3. Trigger test events:
   ```bash
   # Test checkout session completed
   stripe trigger checkout.session.completed
   
   # Test payment intent succeeded
   stripe trigger payment_intent.succeeded
   
   # Test invoice payment succeeded
   stripe trigger invoice.payment_succeeded
   ```

4. Check the logs in both terminals and in `/tmp/stripe-events.log`

### Testing in Staging/Production

1. Configure webhook in Stripe Dashboard (see "Getting Your Webhook Secret" above)
2. Set `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
3. Deploy your application
4. Test using Stripe Dashboard → Webhooks → Send test webhook
5. Monitor webhook delivery attempts in Stripe Dashboard

## Implementation Checklist

Before deploying to production, ensure you complete these tasks:

- [ ] **Set STRIPE_WEBHOOK_SECRET in staging and production**
  - Verify the webhook secret is configured in Vercel for each environment
  - Test webhook delivery in staging before production

- [ ] **Replace dev-only /tmp logging with real DB updates**
  - Implement database persistence logic in the webhook handler
  - Replace the `TODO: Add database update logic here` comment
  - Remove or conditionally disable the `/tmp/stripe-events.log` file writing

- [ ] **Add CI integration tests for webhooks**
  - Add automated tests to your CI pipeline
  - Consider using Stripe webhook testing tools
  - Mock Stripe API calls for faster test execution

- [ ] **Set up monitoring and alerting**
  - Monitor webhook delivery success rates in Stripe Dashboard
  - Set up alerts for webhook failures
  - Add application-level logging/monitoring for webhook processing

- [ ] **Test error scenarios**
  - Test with invalid signatures
  - Test with malformed payloads
  - Verify error responses don't leak sensitive data

## Troubleshooting

### Webhook signature verification fails

- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify you're using the correct secret for your environment (test vs. live)
- Check that the raw request body is being used (bodyParser must be disabled)
- Verify the `stripe-signature` header is present

### Webhook never receives events

- Check that the webhook endpoint is publicly accessible
- Verify the webhook URL in Stripe Dashboard is correct
- Check Stripe Dashboard → Webhooks for delivery attempts and errors
- Ensure your Vercel deployment is successful

### Events are not being processed

- Check server logs for errors
- Verify the event type is in the whitelisted `HANDLED_EVENTS` array
- Check `/tmp/stripe-events.log` in development for logged events
- Use Stripe Dashboard to resend webhook events for testing

## Security Notes

- Never commit `STRIPE_SECRET` or `STRIPE_WEBHOOK_SECRET` to version control
- Always verify webhook signatures before processing events
- Don't log sensitive customer data or full Stripe objects
- Use environment-specific secrets (separate for test and live modes)
- Implement rate limiting on the webhook endpoint to prevent abuse

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
