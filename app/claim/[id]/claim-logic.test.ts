import type { Lock } from "@kinlock/sdk";
import { describe, expect, it, vi } from "vitest";
import { checkReference, findReceiptIndex, releaseErrorKey, trancheStatus } from "./claim-logic";

const lock = (over: Partial<Lock> = {}): Lock => ({
  id: 9n,
  sender: "GBBUI4N57S3TBUZTUKQPKWY5DERT2ZHQN4LLQZ747W7CD5HU3FGHWDH3",
  payeeId: "44".repeat(32),
  payout: "GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM",
  token: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  total: 20n,
  released: 0n,
  returned: 0n,
  refHash: "ab".repeat(32),
  tranches: [
    { amount: 10n, unlockAt: 100n, released: true },
    { amount: 10n, unlockAt: 200n, released: false },
  ],
  expiresAt: 300n,
  state: "Open",
  createdAt: 50n,
  ...over,
});

describe("trancheStatus (mirrors the contract's release rule)", () => {
  it("covers each state and the boundaries", () => {
    const l = lock();
    expect(trancheStatus(l, 0, 150n)).toBe("released");
    expect(trancheStatus(l, 1, 199n)).toBe("locked");
    expect(trancheStatus(l, 1, 200n)).toBe("claimable"); // now == unlock_at
    expect(trancheStatus(l, 1, 299n)).toBe("claimable"); // now == expires_at - 1
    expect(trancheStatus(l, 1, 300n)).toBe("expired"); // now == expires_at
    expect(trancheStatus(lock({ state: "Declined" }), 1, 250n)).toBe("closed");
    expect(trancheStatus(l, 5, 250n)).toBe("closed");
  });
});

describe("checkReference", () => {
  it("matches, mismatches, or reports a missing fragment", async () => {
    const hash = vi.fn(async (r: string) => (r === "INV-1" ? "ab".repeat(32) : "cd".repeat(32)));
    expect(await checkReference({ reference: "INV-1", salt: "s" }, lock(), hash)).toEqual({
      status: "match",
      reference: "INV-1",
    });
    expect((await checkReference({ reference: "INV-2", salt: "s" }, lock(), hash)).status).toBe(
      "mismatch",
    );
    expect(await checkReference(null, lock(), hash)).toEqual({ status: "missing" });
  });
});

describe("findReceiptIndex", () => {
  it("returns the first index verified as a Released receipt", async () => {
    const verify = vi.fn(async ({ eventIndex }: { txHash: string; eventIndex: number }) =>
      eventIndex === 1
        ? {
            valid: true,
            tier: "live_rpc" as const,
            kind: "Released" as const,
            reason: "verified" as const,
            receipt: null,
          }
        : { valid: false, tier: null, kind: null, reason: "not_found" as const, receipt: null },
    );
    expect(await findReceiptIndex("ab".repeat(32), verify)).toBe(1);
    expect(verify).toHaveBeenCalledTimes(2);
  });

  it("returns null when no index verifies", async () => {
    const verify = vi.fn(async () => ({
      valid: false,
      tier: null,
      kind: null,
      reason: "not_found" as const,
      receipt: null,
    }));
    expect(await findReceiptIndex("ab".repeat(32), verify, 2)).toBeNull();
  });
});

describe("releaseErrorKey", () => {
  it("maps contract errors and failed transactions to messages", () => {
    expect(releaseErrorKey({ code: "CONTRACT_ERROR", contractError: "TrancheNotUnlocked" })).toBe(
      "pages.claim.errorNotUnlocked",
    );
    expect(releaseErrorKey({ code: "CONTRACT_ERROR", contractError: "LockExpired" })).toBe(
      "pages.claim.errorExpired",
    );
    expect(releaseErrorKey({ code: "CONTRACT_ERROR", contractError: "Mystery" })).toBe(
      "pages.claim.errorGeneric",
    );
    expect(releaseErrorKey({ code: "TX_FAILED" })).toBe("pages.claim.errorTx");
    expect(releaseErrorKey(new Error("x"))).toBe("pages.claim.errorGeneric");
  });
});
