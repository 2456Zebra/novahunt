module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // NOTE: 'unsafe-inline' is included temporarily for script/style to avoid blocking
            // Next.js/Stripe inline/runtime scripts during troubleshooting. Replace with nonce/hash-based
            // policy before final production hardening.
            value: [
              "default-src 'self'",
              "script-src 'self' https://js.stripe.com 'unsafe-inline'",
              "connect-src 'self' https://api.stripe.com https://js.stripe.com",
              "frame-src https://js.stripe.com https://checkout.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.stripe.com",
              "font-src 'self' data:"
            ].join('; ')
          }
        ]
      }
    ];
  }
};
