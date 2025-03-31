import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '40mb',
    },
    //   ppr: 'incremental'
  },
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
