/**
 * [sec] Security headers. DRAFT: CSP must be finalized in M3-14 (connect-src needs the RPC and
 * indexer origins from config). /claim/* gets the strictest policy: no third-party scripts.
 */
import type { NextConfig } from "next";

const claimCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/claim/:path*",
        headers: [{ key: "Content-Security-Policy", value: claimCsp }],
      },
    ];
  },
};

export default nextConfig;
