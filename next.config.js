/**
 * next.config.js
 *
 * IMPORTANT:
 * - If you already have a next.config.js with other settings, DO NOT blindly overwrite it.
 *   Instead merge the async headers() return value below into your existing config's headers() function.
 *
 * - This file adds a permissive but practical Content-Security-Policy header so:
 *   1) Vercel Live /feedback script (https://vercel.live) can load,
 *   2) Stripe scripts (https://js.stripe.com) continue to work,
 *   3) Inline styles (used by your components) are allowed via 'unsafe-inline' so React inline styles won't be blocked.
 *
 * - If you prefer a stricter CSP, I can generate one that uses style hashes or nonces — tell me and I'll produce it.
 */

module.exports = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              // Keep default-src tight, allow scripts from stripe and vercel.live and allow inline styles
              "default-src 'self'; " +
              "script-src 'self' https://js.stripe.com https://vercel.live 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data:; " +
              "connect-src 'self' https://api.stripe.com https://vercel.live; " +
              "font-src 'self' data:; " +
              "frame-src https://js.stripe.com;"
          },
        ],
      },
    ];
  },
};
