import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pokemontcg.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "tcgplayer-cdn.tcgplayer.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ruuhbwjmhqecomwrgaeq.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
