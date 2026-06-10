import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
