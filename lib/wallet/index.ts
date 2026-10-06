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

export { createStellarWalletsKitAdapter } from "./stellar-wallets-kit";
