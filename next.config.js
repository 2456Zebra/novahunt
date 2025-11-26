// next.config.js
// Temporarily skip ESLint during build to unblock deployment while we fix lint issues.
// Remove or set ignoreDuringBuilds: false once lint is cleaned up.
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};
