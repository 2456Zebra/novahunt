/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias['@'] = require('path').resolve(__dirname, './');
    }
    return config;
  },
};

module.exports = nextConfig;
