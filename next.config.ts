import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export", // Enables static export
  assetPrefix: isProd ? "/free-card-counter/" : "", // Replace with your GitHub repo name
  images: {
    unoptimized: true, // Disables Next.js Image Optimization for static export
  },
};

export default nextConfig;
