- Validate email inputs server-side for signup, signin, and create-checkout-session routes.
- Add basic request shape guards and avoid logging raw PII in production.
- Initialize Stripe client with an API version; keep dev mock fallback for local development.
- Replace innerHTML usage in public/index.js with safe DOM construction to reduce XSS surface and fix malformed Show More markup.

Notes:
- These changes are an incremental hardening step. Production items still TODO:
  - [ ] Integrate a real email provider (SendGrid/SES)
  - [ ] Persist users in a DB
  - [ ] Add rate-limiting/CAPTCHA
  - [ ] Add Stripe webhook signature verification