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
    NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,

  },
};

export default nextConfig;
