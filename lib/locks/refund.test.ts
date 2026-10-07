import type { Lock, Payee } from "@kinlock/sdk";
import { describe, expect, it } from "vitest";
import { SUSPENSION_REFUND_GRACE_SECS } from "@/lib/constants";
import { refundEligibility } from "./refund";

const lock = (over: Partial<Lock> = {}): Lock => ({
  id: 1n,
  sender: "GBBUI4N57S3TBUZTUKQPKWY5DERT2ZHQN4LLQZ747W7CD5HU3FGHWDH3",
  payeeId: "44".repeat(32),
  payout: "GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM",
  token: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  total: 10n,
  released: 0n,
  returned: 0n,
  refHash: "ab".repeat(32),
  tranches: [{ amount: 10n, unlockAt: 100n, released: false }],
  expiresAt: 10_000_000n,
  state: "Open",
  createdAt: 1n,
  ...over,
});
const payee = (status: Payee["status"], statusChangedAt = 1_000n): Payee => ({
  payout: "GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM",
  category: "School",
  status,
  statusChangedAt,
  attester: "GCZRNEOGZH7FVJTA4OQN2YQ5LMS7LSV2GP7PWJFC73SMSLPA56DRAPQT",
  metaHash: "cd".repeat(32),
  registeredAt: 1n,
});

describe("refundEligibility mirrors the contract", () => {
  it("expiry boundary: refused at expires_at - 1, allowed at expires_at", () => {
    const l = lock({ expiresAt: 5_000n });
    expect(refundEligibility(l, payee("Active"), 4_999n)).toEqual({ allowed: false, from: 5_000n });
    expect(refundEligibility(l, payee("Active"), 5_000n)).toEqual({
      allowed: true,
      reason: "Expired",
    });
  });

  it("a Revoked payee allows a refund at once", () => {
    expect(refundEligibility(lock(), payee("Revoked"), 2_000n)).toEqual({
      allowed: true,
      reason: "Revoked",
    });
  });

  it("a Suspended payee allows a refund only after the 14-day grace (boundary included)", () => {
    const changed = 1_000n;
    const graceEnds = changed + SUSPENSION_REFUND_GRACE_SECS;
    expect(refundEligibility(lock(), payee("Suspended", changed), graceEnds - 1n)).toEqual({
      allowed: false,
      from: graceEnds,
    });
    expect(refundEligibility(lock(), payee("Suspended", changed), graceEnds)).toEqual({
      allowed: true,
      reason: "SuspendedTimeout",
    });
  });

  it("reports the earlier of expiry and grace end", () => {
    const l = lock({ expiresAt: 500_000n });
    expect(refundEligibility(l, payee("Suspended", 1_000n), 2_000n)).toEqual({
      allowed: false,
      from: 500_000n,
    });
  });

  it("never allows a refund on a closed lock", () => {
    for (const state of ["Completed", "Refunded", "Declined"] as const) {
      expect(refundEligibility(lock({ state }), payee("Revoked"), 99_999_999n)).toEqual({
        allowed: false,
        from: null,
      });
    }
  });

  it("an unknown payee only allows refunds after expiry", () => {
    expect(refundEligibility(lock({ expiresAt: 5_000n }), null, 4_000n)).toEqual({
      allowed: false,
      from: 5_000n,
    });
  });
});
