import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ntrpkwvhnbssnlmorwqv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // Raised from 1MB default to support photo uploads
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
