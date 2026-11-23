import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@react-pdf/renderer', 'pdfkit'],
  outputFileTracingIncludes: {
    '/api/report/pdf': ['./node_modules/**/*.cjs', './node_modules/**/*.afm'],
  },
};

export default nextConfig;
