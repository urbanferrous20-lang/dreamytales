import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.dreamytales.co.za" }],
        destination: "https://dreamytales.co.za/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
