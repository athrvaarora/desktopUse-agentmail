import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
  },
  
  // Ignore example directories during build
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules',
        '**/.git',
        '../examples/**',
        '../desktop-control-sdk/examples/**',
        '../llm-nav/examples/**',
      ],
    };
    return config;
  },
};

export default nextConfig;
