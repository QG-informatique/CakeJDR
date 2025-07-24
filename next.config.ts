import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  env: {
    LIVEBLOCKS_KEY: process.env.LIVEBLOCKS_KEY,
    CLOUDINARY_KEY: process.env.CLOUDINARY_KEY,
  },
};

export default nextConfig;
