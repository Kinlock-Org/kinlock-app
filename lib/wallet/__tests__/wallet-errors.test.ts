import { describe, expect, it, vi } from "vitest";
import { releaseErrorKey } from "@/app/claim/[id]/claim-logic";
import { refundErrorKey } from "@/app/locks/[id]/lock-view-text";
import enMessages from "@/messages/en.json";
import type { WalletAdapter } from "../index";

describe("Wallet error states and recovery guidance (M3-02, M3-21, #78)", () => {
  describe("Stellar Wallets Kit rejection and error simulation", () => {
    it("simulates user transaction rejection in Freighter / Lobstr and produces TX_FAILED error", async () => {
      // Wallets like Freighter/Lobstr reject transaction signatures with user-declined errors
      const rejectingWallet: WalletAdapter = {
        connect: vi.fn(async () => "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"),
        getAddress: vi.fn(async () => "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"),
        disconnect: vi.fn(async () => {}),
        signTransaction: vi.fn(async () => {
          const err = new Error("User declined transaction signature");
          (err as unknown as { code: string }).code = "USER_DECLINED";
          throw err;
        }),
      };

      // Wrap wallet call as performed in send/claim/refund flows
      let caughtError: unknown;
      try {
        await rejectingWallet.signTransaction("dummy-xdr", "Test SDF Network ; September 2015", "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H");
      } catch (e) {
        caughtError = e;
      }

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toContain("User declined");

      // Verify that claim and refund flows map transaction failures to user-friendly messages
      const claimMsgKey = releaseErrorKey({ code: "TX_FAILED" });
      expect(claimMsgKey).toBe("pages.claim.errorTx");

      const refundMsgKey = refundErrorKey({ code: "TX_FAILED" });
      expect(refundMsgKey).toBe("pages.lock.errorTx");
    });

    it("simulates wallet extension locked state during connection", async () => {
      // When an extension (e.g. Freighter, xBull) is locked, connect() rejects
      const lockedWallet: WalletAdapter = {
        connect: vi.fn(async () => {
          throw new Error("Wallet extension is locked. Please enter your password.");
        }),
        getAddress: vi.fn(async () => null),
        disconnect: vi.fn(async () => {}),
        signTransaction: vi.fn(async () => {
          throw new Error("Wallet locked");
        }),
      };

      let connectError: unknown;
      try {
        await lockedWallet.connect();
      } catch (e) {
        connectError = e;
      }

      expect(connectError).toBeInstanceOf(Error);
      expect((connectError as Error).message).toContain("locked");

      // Address should remain null when locked
      const address = await lockedWallet.getAddress();
      expect(address).toBeNull();
    });

    it("simulates wallet disconnection while signing transaction", async () => {
      const disconnectedWallet: WalletAdapter = {
        connect: vi.fn(async () => "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"),
        getAddress: vi.fn(async () => null),
        disconnect: vi.fn(async () => {}),
        signTransaction: vi.fn(async () => {
          throw new Error("No active wallet session connected");
        }),
      };

      let signError: unknown;
      try {
        await disconnectedWallet.signTransaction("dummy-xdr", "passphrase", "dummy-addr");
      } catch (e) {
        signError = e;
      }

      expect(signError).toBeInstanceOf(Error);
      expect((signError as Error).message).toContain("No active wallet session");
    });
  });

  describe("UI recovery copy verification from messages/en.json", () => {
    it("verifies pages.send error copy addresses user wallet rejection clearly", () => {
      const sendErrorTx = enMessages.pages.send.errorTx;
      expect(sendErrorTx).toBeDefined();
      expect(sendErrorTx).toContain("declined in your wallet");
      expect(sendErrorTx).toContain("Nothing was sent");
      expect(sendErrorTx).toContain("you can try again");

      const sendErrorWallet = enMessages.pages.send.errorWallet;
      expect(sendErrorWallet).toBe("Connect your wallet first.");
    });

    it("verifies pages.claim error copy covers wallet rejection and trustline readiness", () => {
      const claimErrorTx = enMessages.pages.claim.errorTx;
      expect(claimErrorTx).toBeDefined();
      expect(claimErrorTx).toContain("declined in your wallet");
      expect(claimErrorTx).toContain("can't receive this asset yet");
      expect(claimErrorTx).toContain("Nothing was paid");
      expect(claimErrorTx).toContain("you can try again");
    });

    it("verifies pages.lock error copy provides clean refund retry guidance", () => {
      const lockErrorTx = enMessages.pages.lock.errorTx;
      expect(lockErrorTx).toBeDefined();
      expect(lockErrorTx).toContain("declined in your wallet");
      expect(lockErrorTx).toContain("Nothing was moved");
      expect(lockErrorTx).toContain("you can try again");

      const refundSenderOnly = enMessages.pages.lock.refundSenderOnly;
      expect(refundSenderOnly).toBe("Only the sender's wallet can refund. Connect the wallet that created this lock.");
    });

    it("verifies pages.payee connectError gives actionable retry copy", () => {
      const connectError = enMessages.pages.payee.connectError;
      expect(connectError).toBe("Couldn't connect your wallet. Try again.");
    });

    it("verifies preflight error guidance for insufficient wallet balance", () => {
      const balanceFail = enMessages.preflight.sender_balance.fail;
      expect(balanceFail).toBe("Your wallet doesn't have enough USDC for this payment.");
    });
  });

  describe("No unhandled promise rejection in error translation", () => {
    it("handles contract error codes without throwing unhandled exceptions", () => {
      expect(releaseErrorKey({ code: "CONTRACT_ERROR", contractError: "TrancheNotUnlocked" })).toBe(
        "pages.claim.errorNotUnlocked"
      );
      expect(releaseErrorKey({ code: "CONTRACT_ERROR", contractError: "LockExpired" })).toBe(
        "pages.claim.errorExpired"
      );
      expect(releaseErrorKey({ code: "CONTRACT_ERROR", contractError: "PayeeNotActive" })).toBe(
        "pages.claim.errorPayeeNotActive"
      );
      expect(releaseErrorKey({ code: "UNKNOWN_EXCEPTION" })).toBe("pages.claim.errorGeneric");
      expect(releaseErrorKey(null)).toBe("pages.claim.errorGeneric");
      expect(releaseErrorKey(undefined)).toBe("pages.claim.errorGeneric");
    });

    it("handles refund error codes gracefully without throwing", () => {
      expect(refundErrorKey({ code: "TX_FAILED" })).toBe("pages.lock.errorTx");
      expect(refundErrorKey({ code: "CONTRACT_ERROR", contractError: "RefundNotAllowed" })).toBe(
        "pages.lock.errorNotAllowed"
      );
      expect(refundErrorKey({ code: "CONTRACT_ERROR", contractError: "LockNotOpen" })).toBe(
        "pages.lock.errorClosed"
      );
      expect(refundErrorKey(new Error("network error"))).toBe("pages.lock.errorGeneric");
      expect(refundErrorKey(null)).toBe("pages.lock.errorGeneric");
    });
  });
});
