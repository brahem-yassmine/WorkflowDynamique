import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // @ts-ignore - Resolving ambiguous workspace root warning
  turbopack: {
    root: '.',
  }
};

export default nextConfig;
