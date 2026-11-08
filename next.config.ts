import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by the Dockerfile (copies .next/standalone); ignored by Vercel
  output: 'standalone',
  basePath: '/trackfolio',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/trackfolio',
  },
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
};

export default nextConfig;
