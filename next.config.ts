import type { NextConfig } from 'next';
const nextConfig: NextConfig = { devIndicators: false, ...(process.env.RAINLIT_STATIC_EXPORT === "1" ? { output: "export" as const } : {}), turbopack: { root: process.cwd() }, ...(process.env.RAINLIT_STATIC_EXPORT === "1" ? {} : { async rewrites() { return [{ source: "/api/:path*", destination: "http://127.0.0.1:8787/api/:path*" }]; } }) };
export default nextConfig;
