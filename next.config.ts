import type { NextConfig } from "next";

const nextConfig: any = {
  output: 'standalone',
  basePath: '/trackfolio',
  allowedDevOrigins: ['0.0.0.0', '10.38.117.40', 'localhost'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/trackfolio',
        basePath: false,
        permanent: false,
      },
    ];
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
