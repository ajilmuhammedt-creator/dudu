import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  allowedDevOrigins: ['192.168.1.104', 'localhost:3000', '192.168.1.104:3000'],
};

export default nextConfig;
