## Summary

### feat(stripe): add webhook endpoint with signature verification

This PR adds a production-ready Stripe webhook handler with the following components:

**Added Files:**
- `pages/api/stripe-webhook.js` - Webhook endpoint with signature verification using `STRIPE_WEBHOOK_SECRET`
  - Handles POST requests only
  - Verifies webhook signatures using Stripe SDK
  - Processes whitelisted events: `checkout.session.completed`, `payment_intent.succeeded`, `invoice.payment_succeeded`
  - Includes placeholder for database persistence logic
  - Logs events to `/tmp/stripe-events.log` in non-production environments
- `docs/stripe-webhook.md` - Comprehensive setup and testing instructions
  - Environment variable configuration for Vercel
  - Stripe Dashboard and CLI setup instructions
  - Testing procedures and troubleshooting guide
- `scripts/test-stripe-webhook.js` - Manual test runner with signature generation
  - Tests handled and unhandled event types
  - Validates webhook signature verification
- `tests/stripe-webhook.test.js` - Basic integration tests (skipped if secrets not configured)

**Implementation Checklist:**
- [ ] Set STRIPE_WEBHOOK_SECRET in staging and production Vercel environments
- [ ] Replace dev-only /tmp logging with real DB updates
- [ ] Add CI integration tests for webhooks

**Security Features:**
- Raw body parsing for signature verification
- Whitelisted event types
- No sensitive data leakage in error responses
- Environment-specific logging

See `docs/stripe-webhook.md` for complete setup and testing instructions.