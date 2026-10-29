/**
 * Test-only wallet adapter for the Playwright e2e suite (roadmap M3-19). Signs directly with
 * a testnet-only keypair instead of opening a real wallet, so `/send` and `/claim` can be
 * driven unattended in CI. Never imported unless `NEXT_PUBLIC_E2E_TEST_MODE` is set at build
 * time (see `createDefaultWalletAdapter` in `./index`) -- that flag is never set for a real
 * deployment, so this file and its `@stellar/stellar-sdk` import are dead-code-eliminated out
 * of the real production bundle, not just hidden behind a runtime check.
 */
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
import type { WalletAdapter } from "./index";

export function createTestKeypairAdapter(secretKey: string): WalletAdapter {
  const keypair = Keypair.fromSecret(secretKey);
  const address = keypair.publicKey();
  return {
    async connect() {
      return address;
    },
    async getAddress() {
      return address;
    },
    async signTransaction(xdr, networkPassphrase) {
      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
      tx.sign(keypair);
      return tx.toXDR();
    },
    async disconnect() {},
  };
}
