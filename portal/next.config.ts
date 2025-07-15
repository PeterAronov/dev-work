// portal/next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@langchain/core", "@langchain/openai", "langchain"],
  },
  webpack: (config, { isServer }) => {
    // Allow imports from parent directories
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/packages": path.resolve(__dirname, "../packages"),
    };

    if (isServer) {
      config.externals.push({
        "@langchain/core": "@langchain/core",
        "@langchain/openai": "@langchain/openai",
        langchain: "langchain",
      });
    }
    return config;
  },
};

export default nextConfig;
