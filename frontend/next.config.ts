import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",       // 👈 REQUIRED
  images: {
    unoptimized: true     // 👈 REQUIRED for static export
  }
};

export default nextConfig;
