import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // experimental: {
  //   ppr: 'incremental'
  // }
  // env: {
  //   AUTH_URL: process.env.VERCEL_URL
  //     ? `https://${process.env.VERCEL_URL}/api/auth`
  //     : process.env.AUTH_URL,
  // },
  images: {
    remotePatterns: [
      {
        protocol: 'https', // Protocol used by Vercel Blob URLs
        hostname: 'azrzumfofdmruypp.public.blob.vercel-storage.com', // <--- Your specific hostname from the error
        port: '', // Leave empty for default ports (usually 80 or 443)
        pathname: '/customers/**', // Optional: Be more specific if all customer images are under this path
        // Using '/**' allows any path on that host
      },
      // Add other patterns here if you load images from other external domains
    ],
  },
};

export default nextConfig;
