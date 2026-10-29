/**
 * Wallet access goes through this interface so wallets stay swappable (AGENTS.md §8.3,
 * roadmap M3-02). The only implementation today is Stellar Wallets Kit (Freighter, xBull,
 * Albedo, Lobstr, and others), loaded in the browser only.
 */
export interface WalletAdapter {
  /** Let the user pick a wallet and connect; resolves to their Stellar address. */
  connect(): Promise<string>;
  /** The connected address, or null if no wallet is connected. */
  getAddress(): Promise<string | null>;
  /** Sign a transaction (base64 XDR) for the given network; resolves to the signed XDR. */
  signTransaction(xdr: string, networkPassphrase: string, address: string): Promise<string>;
  disconnect(): Promise<void>;
}

import { createStellarWalletsKitAdapter } from "./stellar-wallets-kit";

export { createStellarWalletsKitAdapter };

declare global {
  interface Window {
    /** Set only by the Playwright e2e suite's init script. Never present for a real user. */
    __KINLOCK_E2E_TEST_SECRET__?: string;
  }
}

/**
 * The real wallet-kit adapter, unless the e2e test build (`NEXT_PUBLIC_E2E_TEST_MODE`) is
 * active and the page set a test secret. The `import("./test-adapter")` below is a *dynamic*
 * import inside the conditional, not a top-level one: a top-level `import` is hoisted by the ES
 * module spec regardless of surrounding code, so it would ship even when unused -- verified by
 * inspecting a real `pnpm build` output directly: with a top-level import, `createTestKeypairAdapter`
 * showed up in a real client chunk even with the flag unset. With the dynamic import instead,
 * `NEXT_PUBLIC_E2E_TEST_MODE` unset makes the branch statically false, and a second build
 * confirmed (via grep across every file in `.next/static/chunks`) that `test-adapter.ts`'s
 * actual payload -- `Keypair.fromSecret`, `TransactionBuilder.fromXDR`, anything from
 * `@stellar/stellar-sdk` -- is absent from all of them; only the small always-present dispatcher
 * function above (this one) ships, taking the real-wallet branch. Roadmap M3-19.
 */
export async function createDefaultWalletAdapter(
  networkPassphrase: string,
): Promise<WalletAdapter> {
  if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1") {
    const secret = typeof window !== "undefined" ? window.__KINLOCK_E2E_TEST_SECRET__ : undefined;
    if (secret) {
      const { createTestKeypairAdapter } = await import("./test-adapter");
      return createTestKeypairAdapter(secret);
    }
  }
  return createStellarWalletsKitAdapter(networkPassphrase);
}
