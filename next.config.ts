/**
 * [sec] Site-wide security headers. /claim/* also gets a per-request nonce CSP from proxy.ts
 * (roadmap M3-14). Referrer-Policy no-referrer keeps any URL from leaking to other sites.
 *
 * The indexer's list API is served on our own origin (rewrites below), so the browser needs no
 * CORS for preflight's warnings or receipt lookups, and the claim page's connect-src 'self'
 * covers it. Pages win over rewrites (afterFiles), so /locks/[id] stays the app's page.
 */
import type { NextConfig } from "next";

const indexer = process.env.NEXT_PUBLIC_INDEXER_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!indexer) return { beforeFiles: [], afterFiles: [], fallback: [] };
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/payees", destination: `${indexer}/payees` },
        { source: "/locks", destination: `${indexer}/locks` },
        {
          source: "/events/:txHash/:eventIndex",
          destination: `${indexer}/events/:txHash/:eventIndex`,
        },
      ],
      fallback: [],
    };
  },
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
