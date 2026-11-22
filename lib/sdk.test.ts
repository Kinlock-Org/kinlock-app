import type { rpc } from "@stellar/stellar-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WalletAdapter } from "./wallet";

const calls: unknown[][] = [];
vi.mock("@kinlock/sdk", async (importOriginal) => ({
  KinlockError: (await importOriginal<typeof import("@kinlock/sdk")>()).KinlockError,
  getLock: vi.fn(async (...args: unknown[]) => {
    calls.push(["getLock", ...args]);
    return null;
  }),
  release: vi.fn(async (...args: unknown[]) => {
    calls.push(["release", ...args]);
    return { txHash: "ab" };
  }),
}));

const ENV = {
  NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
  NEXT_PUBLIC_RPC_URLS: "https://rpc-a.example,https://rpc-b.example",
  NEXT_PUBLIC_CONTRACT_ID: "CCSHDQFRYFC3AHV5NE6ULQW6X2CMG5RPANBORDXJGSUD6UKECASJQBRI",
  NEXT_PUBLIC_INDEXER_URL: "https://indexer.example",
  NEXT_PUBLIC_USDC_CONTRACT_ID: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  NEXT_PUBLIC_USDC_ISSUER: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};
for (const [k, v] of Object.entries(ENV)) process.env[k] = v;

const lib = await import("./sdk");
const ADDRESS = "GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM";

beforeEach(() => {
  calls.length = 0;
});

describe("lib/sdk", () => {
  it("builds one SDK config from the public env (first RPC URL, indexer, passphrase)", () => {
    expect(lib.kinlockConfig()).toEqual({
      rpcUrl: "https://rpc-a.example",
      networkPassphrase: "Test SDF Network ; September 2015",
      contractId: ENV.NEXT_PUBLIC_CONTRACT_ID,
      indexerUrl: "https://indexer.example",
      allowHttp: false,
    });
    expect(lib.kinlockConfig()).toBe(lib.kinlockConfig());
  });

  it("passes the bound config to every SDK call", async () => {
    await lib.getLock(3n);
    expect(calls[0]).toEqual(["getLock", lib.kinlockConfig(), 3n]);
  });

  it("bridges the wallet adapter to the SDK signer (signing goes to the wallet)", async () => {
    const wallet: WalletAdapter = {
      connect: vi.fn(),
      getAddress: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(async (xdr: string) => `signed:${xdr}`),
    };
    const signer = lib.walletSigner(wallet, ADDRESS);
    expect(signer.address).toBe(ADDRESS);
    const out = await signer.signTransaction("AAAA", {
      networkPassphrase: "Test SDF Network ; September 2015",
    });
    expect(out).toEqual({ signedTxXdr: "signed:AAAA", signerAddress: ADDRESS });
    expect(wallet.signTransaction).toHaveBeenCalledWith(
      "AAAA",
      "Test SDF Network ; September 2015",
      ADDRESS,
    );

    await lib.release(1n, 0, signer);
    expect(calls[0]).toEqual([
      "release",
      lib.kinlockConfig(),
      { lockId: 1n, trancheIndex: 0 },
      signer,
    ]);
  });

  it("pollTransaction returns status SUCCESS and lockId when confirmed", async () => {
    const { rpc, nativeToScVal } = await import("@stellar/stellar-sdk");
    const getTxSpy = vi.spyOn(rpc.Server.prototype, "getTransaction").mockResolvedValue({
      status: "SUCCESS",
      returnValue: nativeToScVal(99n, { type: "u64" }),
    } as unknown as rpc.Api.GetTransactionResponse);

    const res = await lib.pollTransaction("ab".repeat(32), 1000, 10);
    expect(res).toEqual({ status: "SUCCESS", lockId: 99n });
    getTxSpy.mockRestore();
  });

  it("pollTransaction returns status FAILED when transaction fails on-chain", async () => {
    const { rpc } = await import("@stellar/stellar-sdk");
    const getTxSpy = vi.spyOn(rpc.Server.prototype, "getTransaction").mockResolvedValue({
      status: "FAILED",
    } as unknown as rpc.Api.GetTransactionResponse);

    const res = await lib.pollTransaction("cd".repeat(32), 1000, 10);
    expect(res).toEqual({ status: "FAILED" });
    getTxSpy.mockRestore();
  });

  it("re-exports the SDK's own KinlockError, so instanceof matches errors the SDK throws", async () => {
    const actual = await vi.importActual<typeof import("@kinlock/sdk")>("@kinlock/sdk");
    expect(lib.KinlockError).toBe(actual.KinlockError);
  });

  it("pollTransaction throws KinlockError with TX_PENDING on timeout", async () => {
    const { rpc } = await import("@stellar/stellar-sdk");
    const getTxSpy = vi.spyOn(rpc.Server.prototype, "getTransaction").mockResolvedValue({
      status: "NOT_FOUND",
    } as unknown as rpc.Api.GetTransactionResponse);

    const hash = "ef".repeat(32);
    const error = await lib.pollTransaction(hash, 50, 10).catch((e) => e);
    expect(error).toBeInstanceOf(lib.KinlockError);
    await expect(Promise.reject(error)).rejects.toMatchObject({
      code: "TX_PENDING",
      txHash: hash,
    });
    getTxSpy.mockRestore();
  });
});
