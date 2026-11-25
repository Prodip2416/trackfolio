import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by the Dockerfile (copies .next/standalone); ignored by Vercel
  output: 'standalone',
  basePath: '/trackfolio',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/trackfolio',
  },
  allowedDevOrigins: ['0.0.0.0', '10.38.117.40', 'localhost'],
  // Prize bond result PDFs are uploaded through a server action (default limit is 1 MB).
  // Keep ≤ 4.5mb: that is Vercel's hard request-body limit for functions.
  experimental: {
    serverActions: { bodySizeLimit: '4.5mb' },
  },
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
};

export default nextConfig;
