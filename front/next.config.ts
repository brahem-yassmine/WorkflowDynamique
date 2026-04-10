import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // @ts-ignore - Resolving ambiguous workspace root warning
  turbopack: {
    root: '..',
  },
  turbopack: {
    root: '.'
  }
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
