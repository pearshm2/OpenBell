import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page here is per-user and request-time, so Cache Components stays off.
  // argon2 is a native module; keep it out of the server bundle.
  serverExternalPackages: ["argon2"],
};

export default nextConfig;
