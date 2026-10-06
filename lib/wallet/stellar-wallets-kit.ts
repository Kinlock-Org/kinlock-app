import type { WalletAdapter } from "./index";

type Kit = typeof import("@creit.tech/stellar-wallets-kit").StellarWalletsKit;

let kit: Promise<Kit> | undefined;

/** Loads and initializes the kit once, in the browser only (it touches `window`). */
function loadKit(networkPassphrase: string): Promise<Kit> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("wallets are only available in the browser"));
  }
  kit ??= (async () => {
    const [{ StellarWalletsKit }, { defaultModules }] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit"),
      import("@creit.tech/stellar-wallets-kit/modules/utils"),
    ]);
    StellarWalletsKit.init({
      modules: defaultModules(),
      network: networkPassphrase as never,
    });
    return StellarWalletsKit;
  })();
  return kit;
}

export function createStellarWalletsKitAdapter(networkPassphrase: string): WalletAdapter {
  return {
    async connect() {
      const k = await loadKit(networkPassphrase);
      const { address } = await k.authModal();
      return address;
    },
    async getAddress() {
      try {
        const k = await loadKit(networkPassphrase);
        const { address } = await k.getAddress();
        return address || null;
      } catch {
        return null;
      }
    },
    async signTransaction(xdr, passphrase, address) {
      const k = await loadKit(networkPassphrase);
      const { signedTxXdr } = await k.signTransaction(xdr, {
        networkPassphrase: passphrase,
        address,
      });
      return signedTxXdr;
    },
    async disconnect() {
      const k = await loadKit(networkPassphrase);
      await k.disconnect();
    },
  };
}
