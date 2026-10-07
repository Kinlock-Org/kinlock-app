/**
 * The single configured SDK instance. ONLY this module talks to the contract; components
 * import from here (AGENTS.md §8.3). Roadmap M3-03.
 *
 * Money-moving pages (claim, release, refund, decline) read chain state through `getLock`,
 * never the indexer. Signing always goes through the user's wallet (`WalletAdapter`).
 */

import type {
  CreateLockParams,
  KinlockConfig,
  Lock,
  Payee,
  PreflightParams,
  PreflightResult,
  ReceiptRef,
  Signer,
  VerifyReceiptResult,
} from "@kinlock/sdk";
import * as sdk from "@kinlock/sdk";
import { loadPublicConfig, type PublicConfig } from "./config";
import type { WalletAdapter } from "./wallet";

let cached: { publicConfig: PublicConfig; kinlock: KinlockConfig } | undefined;

/** Config is read and validated once, on first use (so a bad env fails loudly, not silently). */
function configs() {
  if (!cached) {
    const publicConfig = loadPublicConfig();
    cached = {
      publicConfig,
      kinlock: {
        rpcUrl: publicConfig.NEXT_PUBLIC_RPC_URLS[0] as string,
        networkPassphrase: publicConfig.networkPassphrase,
        contractId: publicConfig.NEXT_PUBLIC_CONTRACT_ID,
        indexerUrl: publicConfig.NEXT_PUBLIC_INDEXER_URL,
        allowHttp: publicConfig.NEXT_PUBLIC_STELLAR_NETWORK === "local",
      },
    };
  }
  return cached;
}

export const publicConfig = (): PublicConfig => configs().publicConfig;
export const kinlockConfig = (): KinlockConfig => configs().kinlock;

/** Turn the connected wallet into the SDK's signer for `address`. */
export function walletSigner(wallet: WalletAdapter, address: string): Signer {
  return {
    address,
    signTransaction: async (xdr, opts) => ({
      signedTxXdr: await wallet.signTransaction(
        xdr,
        opts?.networkPassphrase ?? kinlockConfig().networkPassphrase,
        address,
      ),
      signerAddress: address,
    }),
  };
}

export const createLock = (params: CreateLockParams, signer: Signer) =>
  sdk.createLock(kinlockConfig(), params, signer);
export const release = (lockId: bigint, trancheIndex: number, signer: Signer) =>
  sdk.release(kinlockConfig(), { lockId, trancheIndex }, signer);
export const refund = (lockId: bigint, signer: Signer) =>
  sdk.refund(kinlockConfig(), { lockId }, signer);
export const decline = (lockId: bigint, signer: Signer) =>
  sdk.decline(kinlockConfig(), { lockId }, signer);
/** Chain read. The only lock read money-moving pages may use. */
export const getLock = (lockId: bigint): Promise<Lock | null> =>
  sdk.getLock(kinlockConfig(), lockId);
/** Chain read of a payee (status for the refund rule). */
export const getPayee = (payeeId: string): Promise<Payee | null> =>
  sdk.getPayee(kinlockConfig(), payeeId);
export const preflight = (params: PreflightParams): Promise<PreflightResult[]> =>
  sdk.preflight(kinlockConfig(), params);
export const verifyReceipt = (ref: ReceiptRef): Promise<VerifyReceiptResult> =>
  sdk.verifyReceipt(kinlockConfig(), ref);

export {
  buildClaimLink,
  buildRequestLink,
  computeRefHash,
  fromBaseUnits,
  generateSalt,
  KinlockError,
  parseClaimLink,
  parseRequestLink,
  toBaseUnits,
  USDC_DECIMALS,
} from "@kinlock/sdk";
