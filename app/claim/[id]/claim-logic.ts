/** Pure logic for the claim page (kept out of the .tsx for testing). Roadmap M3-09. */
import type { Lock, VerifyReceiptResult } from "@kinlock/sdk";
import type { MessageKey } from "@/lib/i18n/messages";

export type TrancheStatus = "released" | "claimable" | "locked" | "expired" | "closed";

/** Mirrors the contract's release rule: `unlock_at ≤ now < expires_at`, lock Open, not released. */
export function trancheStatus(lock: Lock, idx: number, now: bigint): TrancheStatus {
  const tranche = lock.tranches[idx];
  if (!tranche) return "closed";
  if (tranche.released) return "released";
  if (lock.state !== "Open") return "closed";
  if (now >= lock.expiresAt) return "expired";
  if (now < tranche.unlockAt) return "locked";
  return "claimable";
}

export type ReferenceCheck =
  | { status: "match"; reference: string }
  | { status: "mismatch"; reference: string }
  /** The link had no (valid) #r=…&s=… fragment. */
  | { status: "missing" };

/** Compare the fragment's reference+salt with the lock's on-chain `ref_hash`, in the browser. */
export async function checkReference(
  parts: { reference: string; salt: string } | null,
  lock: Lock,
  computeRefHash: (reference: string, salt: string) => Promise<string>,
): Promise<ReferenceCheck> {
  if (!parts) return { status: "missing" };
  const hash = await computeRefHash(parts.reference, parts.salt);
  return { status: hash === lock.refHash ? "match" : "mismatch", reference: parts.reference };
}

/** The Released event's index in a release transaction, for the receipt URL (null if none). */
export async function findReceiptIndex(
  txHash: string,
  verify: (ref: { txHash: string; eventIndex: number }) => Promise<VerifyReceiptResult>,
  maxIndex = 7,
): Promise<number | null> {
  for (let eventIndex = 0; eventIndex <= maxIndex; eventIndex++) {
    const r = await verify({ txHash, eventIndex });
    if (r.valid && r.kind === "Released") return eventIndex;
  }
  return null;
}

const CONTRACT_ERRORS: Record<string, MessageKey> = {
  TrancheNotUnlocked: "pages.claim.errorNotUnlocked",
  LockExpired: "pages.claim.errorExpired",
  LockNotOpen: "pages.claim.errorClosed",
  TrancheAlreadyReleased: "pages.claim.errorAlreadyReleased",
  PayeeNotActive: "pages.claim.errorPayeeNotActive",
};

/** A user-facing message for an error from a release attempt. */
export function releaseErrorKey(error: unknown): MessageKey {
  const e = error as { code?: string; contractError?: string } | null;
  if (e?.code === "CONTRACT_ERROR" && e.contractError) {
    return CONTRACT_ERRORS[e.contractError] ?? "pages.claim.errorGeneric";
  }
  if (e?.code === "TX_FAILED") return "pages.claim.errorTx";
  return "pages.claim.errorGeneric";
}
