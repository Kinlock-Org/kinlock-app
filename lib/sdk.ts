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
import { rpc, scValToNative } from "@stellar/stellar-sdk";
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
        // In the browser the indexer is reached through our own origin (next.config rewrites).
        indexerUrl:
          typeof window === "undefined"
            ? publicConfig.NEXT_PUBLIC_INDEXER_URL
            : window.location.origin,
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

export const getTransaction = async (txHash: string) => {
  const config = kinlockConfig();
  const server = new rpc.Server(config.rpcUrl, { allowHttp: config.allowHttp ?? false });
  return server.getTransaction(txHash);
};

export interface PollTxResult {
  status: "SUCCESS" | "FAILED";
  lockId?: bigint;
}

/**
 * Poll getTransaction on the configured Soroban RPC server until confirmation
 * or timeout. Used to recover from post-submission timeouts (Item 4).
 */
export async function pollTransaction(
  txHash: string,
  timeoutMs = 30_000,
  intervalMs = 1_500,
): Promise<PollTxResult> {
  const start = Date.now();
  const config = kinlockConfig();
  const server = new rpc.Server(config.rpcUrl, { allowHttp: config.allowHttp ?? false });

  while (Date.now() - start < timeoutMs) {
    try {
      const tx = await server.getTransaction(txHash);
      if (tx.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        let lockId: bigint | undefined;
        if ("returnValue" in tx && tx.returnValue) {
          try {
            const native = scValToNative(tx.returnValue as Parameters<typeof scValToNative>[0]);
            if (typeof native === "bigint") {
              lockId = native;
            } else if (typeof native === "number") {
              lockId = BigInt(native);
            }
          } catch {
            // fallback to events
          }
        }
        if (lockId === undefined && "ledger" in tx && typeof tx.ledger === "number") {
          try {
            const { events } = await server.getEvents({
              startLedger: tx.ledger,
              endLedger: tx.ledger + 1,
              filters: [{ type: "contract", contractIds: [config.contractId] }],
              limit: 1000,
            });
            const created = events.find((e) => e.txHash === txHash);
            if (created?.topic[1]) {
              const val = scValToNative(created.topic[1]);
              if (typeof val === "bigint") lockId = val;
              else if (typeof val === "number") lockId = BigInt(val);
            }
          } catch {
            // ignore
          }
        }
        return { status: "SUCCESS", lockId };
      }
      if (tx.status === rpc.Api.GetTransactionStatus.FAILED) {
        return { status: "FAILED" };
      }
    } catch {
      // transient network/RPC error: retry
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new KinlockError(
    `timed out waiting for transaction ${txHash} to confirm`,
    "TX_PENDING",
    undefined,
    txHash,
  );
}

export class KinlockError extends Error {
  override name = "KinlockError";
  constructor(
    message: string,
    readonly code: sdk.KinlockErrorCode | "TX_PENDING",
    readonly contractError?: string,
    readonly txHash?: string,
  ) {
    super(message);
  }
}

export {
  buildClaimLink,
  buildRequestLink,
  computeRefHash,
  fromBaseUnits,
  generateSalt,
  parseClaimLink,
  parseRequestLink,
  toBaseUnits,
  USDC_DECIMALS,
} from "@kinlock/sdk";
export { scValToNative };
