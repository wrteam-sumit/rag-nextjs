import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure standalone output and disable Turbopack in prod builds on Vercel
  output: "standalone",
  experimental: {
    // Vercel uses Linux; ensure swc/transformers are prebuilt for target
    forceSwcTransforms: true,
  },
};

export default nextConfig;
