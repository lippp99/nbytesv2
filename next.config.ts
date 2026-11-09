import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // dev server reached through this domain (hostname only, no scheme or port)
  allowedDevOrigins: ["dev.nbytes.id"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
