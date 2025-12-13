## feat(auth+checkout): add set-cookie, set-password and checkout session improvements

### Summary

This PR documents the merge of tested Grok authentication and Stripe checkout fixes from `preview/from-prod-with-grok` into `add/stripe-checkout-fix`.

**Note**: Both branches are currently at the same commit (7724306), so this PR serves to document the changes that were previously integrated into both branches.

### Changes

#### Added API Endpoints

1. **pages/api/auth/set-cookie.js** - HttpOnly cookie setter endpoint
   - Accepts POST with `access_token`, `refresh_token`, and `expires_at`
   - Sets HttpOnly cookies: `sb-access-token` and `sb-refresh-token`
   - Cookie attributes: `SameSite=None; Secure; HttpOnly`
   - Automatically computes domain from host header

2. **pages/api/auth/set-password.js** - Server-side user creation/update endpoint
   - Uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations
   - Creates or updates user accounts via Supabase Admin API
   - Verifies Stripe payment status before proceeding
   - Returns ok status after successful operation

#### Added Client Pages

3. **pages/set-password.js** - Client page for password setup flow
   - Accepts query parameters: `?email=...&session_id=...`
   - Calls `/api/auth/set-password` to create/update user server-side
   - Signs in via Supabase client (`signInWithPassword`) to obtain session tokens
   - Posts session tokens to `/api/auth/set-cookie` to set HttpOnly cookies
   - Performs full navigation to `/account` so SSR/middleware sees cookies

#### Updated Files

4. **pages/api/create-checkout-session.js** - Stripe Checkout session creation
   - Ensures Stripe Checkout receives `priceId` and `customer_email`
   - Sets `success_url` to `/set-password?email=...&session_id={CHECKOUT_SESSION_ID}`
   - Configures proper cancel URL

### Testing Notes

- Preview branch `preview/from-prod-with-grok` was deployed to Vercel for testing
- Confirmed build from commit base (7724306)
- End-to-end flow tested: checkout → Stripe → set-password → /account
- Confirmed `Set-Cookie` headers for `sb-access-token` and `sb-refresh-token`
- Verified cookies stored with correct attributes
- Confirmed `/account` shows signed-in state after flow completion

### Environment Variables Required

The following environment variables must be configured:

- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `STRIPE_SECRET_KEY` - Stripe secret API key
- `NEXT_PUBLIC_BASE_URL` - Base URL for the application

### Checklist

- [x] Package.json build script is `"next build"` (no static export)
- [x] next.config.js does not set `output: 'export'`
- [ ] No root `index.html` or `out/` artifacts should be in the branch (currently present, should be removed)
- [x] Required environment variables documented
- [x] Authentication flow tested end-to-end
- [x] Cookies verified to work correctly

### Branch Information

- **Base branch**: `add/stripe-checkout-fix` (commit 7724306)
- **Head branch**: `preview/from-prod-with-grok` (commit 7724306)
- **Status**: Branches are currently identical

### Notes

- Both branches contain the same tested fixes
- This PR documents the changes for tracking and review purposes
- CI (Vercel) will create a preview deployment for testing
- **Do not merge automatically** - requires review first