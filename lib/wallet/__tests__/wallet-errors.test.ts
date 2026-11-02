import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { releaseErrorKey } from "@/app/claim/[id]/claim-logic";
import { t } from "@/lib/i18n/messages";
import { walletSigner } from "@/lib/sdk";
import type { WalletAdapter } from "../index";
import { createStellarWalletsKitAdapter } from "../stellar-wallets-kit";

// Mock the StellarWalletsKit module methods
const mockAuthModal = vi.fn();
const mockGetAddress = vi.fn();
const mockSignTransaction = vi.fn();
const mockDisconnect = vi.fn();
const mockInit = vi.fn();

vi.mock("@creit.tech/stellar-wallets-kit", () => ({
  StellarWalletsKit: {
    init: (...args: unknown[]) => mockInit(...args),
    authModal: (...args: unknown[]) => mockAuthModal(...args),
    getAddress: (...args: unknown[]) => mockGetAddress(...args),
    signTransaction: (...args: unknown[]) => mockSignTransaction(...args),
    disconnect: (...args: unknown[]) => mockDisconnect(...args),
  },
}));

vi.mock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
  defaultModules: vi.fn().mockReturnValue([]),
}));

describe("lib/wallet error handling and simulation (M3-02, M3-21)", () => {
  const PASSPHRASE = "Test SDF Network ; September 2015";
  const TEST_ADDRESS = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ";
  const FAKE_XDR = "AAAAAGXua+5b8k5Z3b+V3Y...";

  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    vi.clearAllMocks();
    originalWindow = globalThis.window;
    // Simulate browser environment for wallet adapter
    // @ts-expect-error test mock
    globalThis.window = {};
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  describe("StellarWalletsKitAdapter environment checks", () => {
    it("rejects immediately when called outside a browser environment", async () => {
      // @ts-expect-error simulate Node/SSR environment
      globalThis.window = undefined;
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);
      await expect(adapter.connect()).rejects.toThrow("wallets are only available in the browser");
    });
  });

  describe("Wallet disconnection states", () => {
    it("returns null from getAddress when wallet is disconnected or getAddress throws", async () => {
      mockGetAddress.mockRejectedValue(new Error("Wallet disconnected"));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      const address = await adapter.getAddress();
      expect(address).toBeNull();
    });

    it("returns null from getAddress when kit returns empty address", async () => {
      mockGetAddress.mockResolvedValue({ address: "" });
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      const address = await adapter.getAddress();
      expect(address).toBeNull();
    });

    it("successfully delegates disconnect call to the kit", async () => {
      mockDisconnect.mockResolvedValue(undefined);
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.disconnect()).resolves.toBeUndefined();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Simulating user rejection error codes during connection", () => {
    it("simulates user closing auth modal or declining connection in Freighter", async () => {
      // Freighter/SWK modal rejection error
      mockAuthModal.mockRejectedValue(new Error("User closed modal"));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.connect()).rejects.toThrow("User closed modal");
    });

    it("simulates user explicitly declining permissions (USER_DECLINED)", async () => {
      mockAuthModal.mockRejectedValue(new Error("USER_DECLINED"));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.connect()).rejects.toThrow("USER_DECLINED");
    });

    it("verifies user-friendly error copy for payee dashboard connection failure", () => {
      // In app/payee/usePayeeDashboard.ts, connection error sets 'pages.payee.connectError'
      const key = "pages.payee.connectError";
      const message = t(key);
      expect(message).toBe("Couldn't connect your wallet. Try again.");
      expect(message).not.toContain("Error");
      expect(message).not.toContain("stack");
    });

    it("verifies user-friendly error copy for send page connection failure", () => {
      // In app/send/useSendForm.ts, connection error sets 'pages.send.errorTx'
      const key = "pages.send.errorTx";
      const message = t(key);
      expect(message).toContain("The transaction didn't go through");
      expect(message).toContain("declined in your wallet");
      expect(message).toContain("Nothing was sent; you can try again.");
    });
  });

  describe("Simulating transaction rejection error codes during signing", () => {
    it("simulates user declining transaction signing in Freighter", async () => {
      // Freighter rejection format
      mockSignTransaction.mockRejectedValue(new Error("User declined transaction"));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.signTransaction(FAKE_XDR, PASSPHRASE, TEST_ADDRESS)).rejects.toThrow(
        "User declined transaction",
      );
    });

    it("simulates Lobstr mobile wallet rejection", async () => {
      mockSignTransaction.mockRejectedValue(new Error("Transaction was declined by user"));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.signTransaction(FAKE_XDR, PASSPHRASE, TEST_ADDRESS)).rejects.toThrow(
        "Transaction was declined by user",
      );
    });

    it("simulates xBull wallet user cancellation code (-4)", async () => {
      const err = new Error("User canceled the request");
      Object.assign(err, { code: -4 });
      mockSignTransaction.mockRejectedValue(err);
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.signTransaction(FAKE_XDR, PASSPHRASE, TEST_ADDRESS)).rejects.toThrow(
        "User canceled the request",
      );
    });
  });

  describe("Simulating wallet extension lock state", () => {
    it("simulates locked extension state during authModal", async () => {
      mockAuthModal.mockRejectedValue(new Error("Wallet is locked. Please unlock first."));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.connect()).rejects.toThrow("Wallet is locked");
    });

    it("simulates locked extension state during signTransaction", async () => {
      mockSignTransaction.mockRejectedValue(new Error("EXTENSION_LOCKED"));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.signTransaction(FAKE_XDR, PASSPHRASE, TEST_ADDRESS)).rejects.toThrow(
        "EXTENSION_LOCKED",
      );
    });
  });

  describe("Simulating fee and balance errors (insufficient XLM)", () => {
    it("simulates op_underfunded or insufficient fee from network / wallet precheck", async () => {
      mockSignTransaction.mockRejectedValue(new Error("tx_insufficient_fee"));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.signTransaction(FAKE_XDR, PASSPHRASE, TEST_ADDRESS)).rejects.toThrow(
        "tx_insufficient_fee",
      );
    });

    it("simulates op_underfunded when minimum XLM balance reserve is breached", async () => {
      mockSignTransaction.mockRejectedValue(new Error("op_underfunded"));
      const adapter = createStellarWalletsKitAdapter(PASSPHRASE);

      await expect(adapter.signTransaction(FAKE_XDR, PASSPHRASE, TEST_ADDRESS)).rejects.toThrow(
        "op_underfunded",
      );
    });
  });

  describe("SDK Signer bridge with failing wallet adapter", () => {
    it("propagates wallet signing rejection through walletSigner", async () => {
      const failingAdapter: WalletAdapter = {
        connect: vi.fn(),
        getAddress: vi.fn().mockResolvedValue(TEST_ADDRESS),
        signTransaction: vi.fn().mockRejectedValue(new Error("User declined transaction")),
        disconnect: vi.fn(),
      };

      const signer = walletSigner(failingAdapter, TEST_ADDRESS);
      expect(signer.address).toBe(TEST_ADDRESS);

      await expect(
        signer.signTransaction(FAKE_XDR, { networkPassphrase: PASSPHRASE }),
      ).rejects.toThrow("User declined transaction");
    });
  });

  describe("Recovery guidance and user-facing error copy (M3-21)", () => {
    it("maps TX_FAILED to honest claim recovery copy on claim page", () => {
      const key = releaseErrorKey({ code: "TX_FAILED" });
      expect(key).toBe("pages.claim.errorTx");
      const text = t(key);
      expect(text).toBe(
        "The transaction didn't go through (it may have been declined in your wallet, or your account can't receive this asset yet). Nothing was paid; you can try again.",
      );
    });

    it("verifies refund rejection error copy on lock details page", () => {
      // In app/locks/[id]/useLockPage.ts, refund signing rejection sets 'pages.lock.errorTx'
      const key = "pages.lock.errorTx";
      const text = t(key);
      expect(text).toBe(
        "The transaction didn't go through (it may have been declined in your wallet). Nothing was moved; you can try again.",
      );
    });

    it("verifies send creation rejection error copy on send page", () => {
      // In app/send/useSendForm.ts, TX_FAILED sets 'pages.send.errorTx'
      const key = "pages.send.errorTx";
      const text = t(key);
      expect(text).toBe(
        "The transaction didn't go through (it may have been declined in your wallet). Nothing was sent; you can try again.",
      );
    });

    it("ensures error strings communicate non-custodial honesty (hard rule 7)", () => {
      // None of the error strings claim funds are lost or unrecoverable
      const sendTx = t("pages.send.errorTx");
      const claimTx = t("pages.claim.errorTx");
      const lockTx = t("pages.lock.errorTx");

      expect(sendTx).toContain("Nothing was sent");
      expect(claimTx).toContain("Nothing was paid");
      expect(lockTx).toContain("Nothing was moved");
    });
  });
});
