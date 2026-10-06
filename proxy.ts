/**
 * [sec] Per-request headers. /claim/* gets a nonce-based Content-Security-Policy so only our own
 * scripts run on the page that holds the claim link's reference and salt (roadmap M3-14).
 * Next.js reads the nonce from the request's CSP header and applies it to its own scripts.
 */
import { type NextRequest, NextResponse } from "next/server";
import { buildClaimCsp, originsOf } from "@/lib/security/csp";

export function proxy(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildClaimCsp({
    nonce,
    rpcOrigins: originsOf(process.env.NEXT_PUBLIC_RPC_URLS),
    dev: process.env.NODE_ENV === "development",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = { matcher: ["/claim/:path*"] };
