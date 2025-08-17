import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {},
  },
  images: {
    domains: ['ghbbkhekshmowhgbnpcx.supabase.co'],
  }
};

export default nextConfig;
