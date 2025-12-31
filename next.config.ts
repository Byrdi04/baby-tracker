import type { NextConfig } from "next";

const nextConfig = {
  // We moved this out of "experimental"
  serverExternalPackages: ['better-sqlite3'], 
};

export default nextConfig;
