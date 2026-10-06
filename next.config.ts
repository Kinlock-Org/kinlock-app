/**
 * [sec] Site-wide security headers. /claim/* also gets a per-request nonce CSP from proxy.ts
 * (roadmap M3-14). Referrer-Policy no-referrer keeps any URL from leaking to other sites.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
