import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - Resolving ambiguous workspace root warning
  turbopack: {
    root: '.',
  }
};

export default nextConfig;
