/**
 * Wallet-kit abstraction so wallets stay swappable (Freighter and others). Roadmap M3-02.
 * Library choice is a dependency decision (ask-first).
 */
export interface WalletAdapter {
  id: string;
  isAvailable(): Promise<boolean>;
  getAddress(): Promise<string>;
  signTransaction(xdr: string, networkPassphrase: string): Promise<string>;
}
