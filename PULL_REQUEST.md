# chore(hardening): validate inputs, avoid innerHTML XSS vectors, and fix UI show-more bug

- Validate email inputs server-side for signup, signin, and create-checkout-session routes.
- Add basic request shape guards and avoid logging raw PII in production.
- Initialize Stripe client with an API version; keep dev mock fallback for local development.
- Replace innerHTML usage in public/index.js with safe DOM construction to reduce XSS surface and fix malformed Show More markup.

Checklist:
- [ ] Integrate email provider (SendGrid/SES) for production magic links and signups
- [ ] Persist users and demo allocations in a database
- [ ] Add rate-limiting / CAPTCHA for signup/signin endpoints
- [ ] Add Stripe webhook signature verification and secure webhook endpoint
- [ ] Add unit/integration tests for API routes and UI rendering

Notes:
- These changes are an incremental hardening step. Production items still TODO: integrate a real email provider (SendGrid/SES), persist users in a DB, add rate-limiting/CAPTCHA, and add Stripe webhook signature verification. Add these as checklist items in the PR description.