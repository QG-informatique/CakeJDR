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
    // Expose the public Liveblocks key to client components.
    LIVEBLOCKS_KEY: process.env.LIVEBLOCKS_KEY,
  },
};

export default nextConfig;
