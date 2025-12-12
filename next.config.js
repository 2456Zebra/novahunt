/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to prefer the old "pages" directory for the root route
  // So your perfect pages/index.js homepage wins — no conflict
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index',
      },
    ];
  },
};

module.exports = nextConfig;
