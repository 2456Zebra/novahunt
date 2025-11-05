## Summary
This PR hardens API routes and the demo UI:
- Validate email inputs server-side for signup, signin, and create-checkout-session.
- Add basic request shape guards and avoid logging raw PII in production.
- Initialize Stripe client with an API version; keep dev mock fallback for local development.
- Replace innerHTML usage in public/index.js with safe DOM construction to reduce XSS surface and fix malformed Show More markup.

NOTE: Production integrations (DB persistence, real email provider, CAPTCHA/rate-limiting, and webhook signature verification) are still TODO.