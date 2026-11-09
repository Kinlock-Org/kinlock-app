/**
 * [sec] Per-request headers. Applies a nonce-based Content-Security-Policy site-wide
 * so only our own scripts run on pages that hold claim links in the URL fragment or localStorage (roadmap M3-14, M3-40).
 * Next.js reads the nonce from the request's CSP header and applies it to its own scripts.
 */
import { type NextRequest, NextResponse } from "next/server";
import { buildClaimCsp, originsOf } from "@/lib/security/csp";

export function proxy(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const rpcOrigins = [
    ...originsOf(process.env.NEXT_PUBLIC_RPC_URLS),
    ...originsOf(process.env.NEXT_PUBLIC_INDEXER_URL),
  ];
  const csp = buildClaimCsp({
    nonce,
    rpcOrigins,
    dev: process.env.NODE_ENV === "development",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
