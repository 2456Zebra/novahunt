module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' https://js.stripe.com",
              "connect-src 'self' https://api.stripe.com https://js.stripe.com",
              "frame-src https://js.stripe.com https://checkout.stripe.com",
              // Temporary practical unblock for runtime-injected styles; remove and harden later.
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.stripe.com",
              "font-src 'self' data:",
            ].join('; ')
          }
        ]
      }
    ];
  }
};
