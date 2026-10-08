import type { ClaimLinkParts } from "@kinlock/sdk";
import type { IndexedLock, IndexedPayee } from "@/lib/indexer";

/** Every payeeId this wallet is the payout address for (usually one, never assumed to be). */
export const matchingPayeeIds = (payees: IndexedPayee[], address: string): string[] =>
  payees.filter((p) => p.payout === address).map((p) => p.payeeId);

export type ReferenceFilterResult =
  | { status: "none" }
  | { status: "invalid" }
  | { status: "found"; lockId: string }
  | { status: "notFound" };

/**
 * Finds the one lock a pasted claim link refers to, among locks already loaded for this payee.
 * The reference and salt never leave the browser (hard rule 5): this only recomputes `ref_hash`
 * locally and compares it, exactly like `/claim/[id]`'s own reference check.
 */
export async function findByReference(
  link: string,
  locks: IndexedLock[],
  parseClaimLink: (link: string) => ClaimLinkParts,
  computeRefHash: (reference: string, salt: string) => Promise<string>,
): Promise<ReferenceFilterResult> {
  if (!link.trim()) return { status: "none" };
  let parts: ClaimLinkParts;
  try {
    parts = parseClaimLink(link);
  } catch {
    return { status: "invalid" };
  }
  const hash = await computeRefHash(parts.reference, parts.salt);
  const match = locks.find((l) => l.refHash === hash && l.id === parts.lockId.toString());
  return match ? { status: "found", lockId: match.id } : { status: "notFound" };
}

/** Newest first, matching the indexer's own pagination order. */
export const byNewest = (locks: IndexedLock[]): IndexedLock[] =>
  [...locks].sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? 1 : -1));
