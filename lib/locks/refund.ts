/**
 * When a sender may refund (hard rule 8), mirroring the contract's `refund` exactly:
 * the lock is Open and now ≥ expires_at, or the payee is Revoked, or the payee has been
 * Suspended for at least the grace period. Inputs come from CHAIN reads only.
 */
import type { Lock, Payee, RefundReason } from "@kinlock/sdk";
import { SUSPENSION_REFUND_GRACE_SECS } from "@/lib/constants";

export type RefundEligibility =
  | { allowed: true; reason: RefundReason }
  /** `from`: the earliest time a refund becomes possible if nothing else changes (null if never). */
  | { allowed: false; from: bigint | null };

export function refundEligibility(lock: Lock, payee: Payee | null, now: bigint): RefundEligibility {
  if (lock.state !== "Open") return { allowed: false, from: null };
  if (now >= lock.expiresAt) return { allowed: true, reason: "Expired" };
  if (payee?.status === "Revoked") return { allowed: true, reason: "Revoked" };
  if (payee?.status === "Suspended") {
    const graceEnds = payee.statusChangedAt + SUSPENSION_REFUND_GRACE_SECS;
    if (now >= graceEnds) return { allowed: true, reason: "SuspendedTimeout" };
    return { allowed: false, from: graceEnds < lock.expiresAt ? graceEnds : lock.expiresAt };
  }
  return { allowed: false, from: lock.expiresAt };
}
