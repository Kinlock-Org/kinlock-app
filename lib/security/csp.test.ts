import { describe, expect, it } from "vitest";
import { buildClaimCsp, originsOf } from "./csp";

const prod = buildClaimCsp({
  nonce: "abc123",
  rpcOrigins: ["https://soroban-testnet.stellar.org"],
  dev: false,
});

describe("claim page CSP", () => {
  it("only runs our own nonce-tagged scripts", () => {
    expect(prod).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(prod).not.toContain("unsafe-eval");
    expect(prod).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(prod).not.toMatch(/script-src[^;]*https?:/);
  });

  it("limits network access to our origin and the RPC servers", () => {
    expect(prod).toContain("connect-src 'self' https://soroban-testnet.stellar.org");
  });

  it("blocks framing, plugins, and base-tag tricks", () => {
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("base-uri 'none'");
  });

  it("allows eval only in development", () => {
    expect(buildClaimCsp({ nonce: "n", rpcOrigins: [], dev: true })).toContain("'unsafe-eval'");
  });

  it("originsOf keeps origins and drops junk", () => {
    expect(originsOf("https://a.example/rpc, nope, https://b.example:8443/x")).toEqual([
      "https://a.example",
      "https://b.example:8443",
    ]);
    expect(originsOf(undefined)).toEqual([]);
  });
});
