name=docs/stripe-webhook.md
# Stripe webhook handler (NovaHunt)

This document explains how to configure, test, and promote the Stripe webhook handler added to /api/stripe-webhook.

Environment variables
- STRIPE_SECRET — your Stripe API secret key (used by the Stripe SDK).
- STRIPE_WEBHOOK_SECRET — the webhook signing secret provided by Stripe (used to verify signatures).
- NODE_ENV — set to `production` in production deployments.

Deploy configuration (Vercel)
1. In your Vercel project settings, add:
   - STRIPE_SECRET (masked)
   - STRIPE_WEBHOOK_SECRET (masked)
   - NODE_ENV=production for production deployments
2. Do NOT commit secrets to git.

Local testing with Stripe CLI
1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run your local dev server (e.g., `npm run dev` on port 3000).
3. Run: `stripe listen --forward-to http://localhost:3000/api/stripe-webhook`
   - The Stripe CLI will show `Listening for events...` and forward events to your local endpoint.
4. Create a test event with the CLI:
   - `stripe trigger checkout.session.completed`
   - Confirm your server receives the event and logs the minimal summary.

Manual test script
- A lightweight script `scripts/test-stripe-webhook.js` is included to demonstrate how to sign and send a payload locally when you have STRIPE_SECRET and STRIPE_WEBHOOK_SECRET. If the SDK provides a helper to generate a test header, the script will use it; otherwise, use the Stripe CLI.

Checklist before production
- [ ] Ensure `STRIPE_WEBHOOK_SECRET` is set in staging and production.
- [ ] Replace dev-only `/tmp/stripe-events.log` with real DB updates.
- [ ] Add integration tests to CI that exercise the webhook handler (or a replay mechanism).
- [ ] Monitor and retry failed webhook processing if necessary.

Security notes
- The handler validates signatures using the webhook secret; do not disable this in production.
- Logs and error messages intentionally avoid echoing full payloads or secrets.
- Ensure database updates for payments are idempotent to avoid double-crediting.
