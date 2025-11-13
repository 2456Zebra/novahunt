# Reveal / Verify behavior (NovaHunt)

Summary
- The public UI calls neutral endpoints: `/api/search-contacts` and `/api/verify-contact`.
- Contact search results are cached in Vercel KV for 1 hour to reduce repeated calls.
- Verifications are cached for 30 days.
- There is a small per-client reveal quota (default 3 reveals / 24 hours) stored in KV to prevent accidental credit burns.

Environment variables to set in Vercel
- HUNTER_API_KEY — your provider API key (kept server-side)
- VERCEL_KV_URL — connection string URL for Vercel KV (if you use Vercel KV; otherwise remove KV lines or provide Redis/other store)
- STRIPE_SECRET_KEY — your Stripe secret key (if you plan to integrate billing for reveals)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — (client-side Stripe key) if needed later

Notes & next steps
- If you want persistent per-user reveal quotas tied to subscriptions, we will:
  - Use authenticated user IDs (Firebase or your auth) and store quota counters per user in KV.
  - Connect quota top-ups to your Stripe subscription or one-off credit purchases.
- The code hides the provider brand from the UI. Do not keep endpoints named `hunter-*` in the public codebase; keep names neutral.
- If you want me to wire Stripe billing for reveal credits (charge for reveals or include in tier), I can add the minimal server endpoints and Stripe webhook handler next.
