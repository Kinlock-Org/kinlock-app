/**
 * Content-Security-Policy for application pages (AGENTS.md §8.3, roadmap M3-14, M3-40).
 * Pages hold the reference and salt in the URL fragment (/claim/*) or in localStorage
 * (sender and dashboard pages), so we allow no third-party scripts at all: only our own
 * scripts carrying this request's nonce run. Network access is limited to our origin,
 * configured Stellar RPC/indexer servers, and wallet kit endpoints.
 */
export function buildClaimCsp(opts: { nonce: string; rpcOrigins: string[]; dev: boolean }): string {
  const scriptSrc = ["'self'", `'nonce-${opts.nonce}'`, "'strict-dynamic'"];
  // Next.js dev mode needs eval for fast refresh; production never gets it.
  if (opts.dev) scriptSrc.push("'unsafe-eval'");

  const connectOrigins = Array.from(
    new Set(["'self'", ...opts.rpcOrigins, "https://*.stellar.org", "https://albedo.link"]),
  ).filter(Boolean);

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connectOrigins.join(" ")}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** Origins (scheme://host[:port]) from a comma-separated URL list; invalid entries are dropped. */
export function originsOf(urls: string | undefined): string[] {
  return (urls ?? "")
    .split(",")
    .map((u) => {
      try {
        return new URL(u.trim()).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}
