/**
 * next.config.js
 *
 * WARNING: If you already have a next.config.js with other settings, back it up first.
 * If you prefer, paste your current next.config.js here and I'll merge the headers() change instead of overwriting.
 *
 * This file adds a Content-Security-Policy header that:
 *  - allows scripts from https://vercel.live (Vercel Live feedback injection),
 *  - keeps Stripe scripts allowed (https://js.stripe.com),
 *  - allows inline styles so React inline style assignments and dynamic style changes don't get blocked.
 *
 * Quick steps:
 * 1) Backup current next.config.js
 * 2) Overwrite this file with the contents below (or merge the headers() block)
 * 3) Commit & push to add/stripe-checkout-fix and redeploy on Vercel
 * 4) Hard-refresh the site (Cmd/Ctrl+Shift+R) after deploy
 */
module.exports = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              // Keep default-src tight; allow vercel.live and stripe scripts; allow inline styles
              "default-src 'self'; " +
              "script-src 'self' https://js.stripe.com https://vercel.live 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data:; " +
              "connect-src 'self' https://api.stripe.com https://vercel.live; " +
              "font-src 'self' data:; " +
              "frame-src https://js.stripe.com https://vercel.live;"
          },
        ],
      },
    ];
  },
};
