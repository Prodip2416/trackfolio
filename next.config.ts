import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  /* config options here */
};

export default nextConfig;
