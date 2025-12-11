// next.config.js
// Adds a Content-Security-Policy header that allows external images (https:) and inline styles.
// TEMPORARY: This uses 'unsafe-inline' for styles to avoid refactoring inline styles across the app.
// For production hardening later, replace 'unsafe-inline' with nonces or move inline styles into CSS classes.

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https:;
  style-src 'self' 'unsafe-inline' https:;
  img-src 'self' data: https:;
  connect-src 'self' https://api.hunter.io https:;
  font-src 'self' data:;
  frame-src 'self' https:;
`;

module.exports = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\n/g, ' ')
          },
        ],
      },
    ];
  },
};
