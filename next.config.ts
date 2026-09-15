import type { NextConfig } from "next";
import { ALIAS_HOSTS, CANONICAL_HOST } from "./lib/site";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // learn.mvp.sa is an alias: send it to the canonical school.mvp.sa (path preserved).
  async redirects() {
    return ALIAS_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `https://${CANONICAL_HOST}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
