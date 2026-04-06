import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Resolving ambiguous workspace root warning
  turbopack: {
    root: '..',
  },
};

export default nextConfig;
