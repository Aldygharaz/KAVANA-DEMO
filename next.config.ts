import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./db/custom.db"],
    "/api/**/*": ["./db/custom.db"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    localPatterns: [
      {
        // tanpa key `search` = query string diizinkan (?v=N untuk cache-busting aset produk)
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
