/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep any other config you need here.
  // Removed the explicit rewrite from '/' -> '/index' so the pages router
  // serves pages/index.js directly. This avoids the preview 404 issue.
  // If you need custom rewrites later, add only the specific ones required.
  // (No homepage content changes.)
  reactStrictMode: true,
};

module.exports = nextConfig;
