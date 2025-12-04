import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['docusign-esign'],
  webpack: (config, { isServer }) => {
    // Exclude docusign-esign from client-side bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'docusign-esign': false,
        '@sparticuz/chromium': false,
        'puppeteer-core': false,
      };
    }
    return config;
  },
};

export default nextConfig;
