import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return ['admin','analytics','core','dashboard','events','gate','leaderboard','marketplace','notes','privacy','projects','settings','societies','team']
      .map(route => ({source:'/'+route+'/:path*',destination:'/mentron/'+route+'/:path*',permanent:true}))
  },
  /* config options here */
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
