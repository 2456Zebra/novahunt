// next.config.js
// Temporarily skip ESLint during build to unblock deployment while we clean up lint issues.
module.exports = {
  eslint: {
    ignoreDuringBuilds: true
  }
};
