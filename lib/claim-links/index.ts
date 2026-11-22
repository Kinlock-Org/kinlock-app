/**
 * [sec] Browser-only storage and export of the sender's claim links. Roadmap M3-07.
 * Claim links contain the reference and salt in the URL fragment: they must NEVER be sent to a
 * server, logged, or passed to third-party scripts (hard rule 5). This module only touches the
 * Storage it is given (localStorage in the browser); it has no network code, and a test checks
 * that it stays that way. If the browser's storage is cleared, the links are gone: there is no
 * server copy by design (ARCHITECTURE.md §5.2, E21), which is why export exists.
 */
import { z } from "zod";
import { buildClaimLink, parseClaimLink } from "@/lib/sdk";

export interface SavedClaimLink {
  lockId: string;
  url: string;
  savedAt: string;
}

/** Versioned key: a format change gets a new key instead of misreading old data. */
export const STORAGE_KEY = "kinlock.claimLinks.v1";

const Saved = z.array(
  z.object({ lockId: z.string().regex(/^[1-9]\d*$/), url: z.string(), savedAt: z.string() }),
);

/** The subset of the Web Storage API used here, so tests can pass an in-memory store. */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/** localStorage, or null where it isn't available (server render, privacy modes). */
export function browserStore(): KeyValueStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Build the claim link for a new lock. The reference and salt go only into the fragment. */
export function newClaimLink(
  origin: string,
  lockId: bigint,
  reference: string,
  salt: string,
): string {
  return buildClaimLink(origin, { lockId, reference, salt });
}

/** All saved links, newest first. Entries that aren't valid claim links are ignored. */
export function listClaimLinks(store: KeyValueStore): SavedClaimLink[] {
  let raw: unknown;
  try {
    raw = JSON.parse(store.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
  const parsed = Saved.safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data
    .filter((l) => {
      try {
        return parseClaimLink(l.url).lockId.toString() === l.lockId;
      } catch {
        return false;
      }
    })
    .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

/** Save (or replace) the link for a lock. Returns false if storage refused (e.g. full). */
export function saveClaimLink(store: KeyValueStore, url: string, now = new Date()): boolean {
  const { lockId } = parseClaimLink(url);
  const others = listClaimLinks(store).filter((l) => l.lockId !== lockId.toString());
  const next: SavedClaimLink[] = [
    { lockId: lockId.toString(), url, savedAt: now.toISOString() },
    ...others,
  ];
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function removeClaimLink(store: KeyValueStore, lockId: string): void {
  const remaining = listClaimLinks(store).filter((l) => l.lockId !== lockId);
  store.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

/** The export file's contents: the sender keeps this file; it is never uploaded. */
export function exportClaimLinks(store: KeyValueStore, now = new Date()): string {
  return `${JSON.stringify(
    {
      kind: "kinlock-claim-links",
      version: 1,
      exportedAt: now.toISOString(),
      links: listClaimLinks(store),
    },
    null,
    2,
  )}\n`;
}

export interface PendingSubmission {
  id: string;
  reference: string;
  salt: string;
  mode: "verified" | "direct";
  recipientOrPayee: string;
  txHash?: string;
  createdAt: string;
}

export const PENDING_STORAGE_KEY = "kinlock.pendingSubmissions.v1";

const PendingSchema = z.array(
  z.object({
    id: z.string(),
    reference: z.string(),
    salt: z.string(),
    mode: z.enum(["verified", "direct"]),
    recipientOrPayee: z.string(),
    txHash: z.string().optional(),
    createdAt: z.string(),
  }),
);

export function listPendingSubmissions(store: KeyValueStore): PendingSubmission[] {
  let raw: unknown;
  try {
    raw = JSON.parse(store.getItem(PENDING_STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
  const parsed = PendingSchema.safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function savePendingSubmission(
  store: KeyValueStore,
  submission: PendingSubmission,
): boolean {
  const others = listPendingSubmissions(store).filter(
    (s) => s.id !== submission.id && (!submission.txHash || s.txHash !== submission.txHash),
  );
  try {
    store.setItem(PENDING_STORAGE_KEY, JSON.stringify([submission, ...others]));
    return true;
  } catch {
    return false;
  }
}

export function getPendingSubmission(store: KeyValueStore, id?: string): PendingSubmission | null {
  const all = listPendingSubmissions(store);
  if (id) {
    return all.find((s) => s.id === id || s.txHash === id) ?? null;
  }
  return all[0] ?? null;
}

export function removePendingSubmission(store: KeyValueStore, id: string): void {
  const remaining = listPendingSubmissions(store).filter((s) => s.id !== id && s.txHash !== id);
  try {
    store.setItem(PENDING_STORAGE_KEY, JSON.stringify(remaining));
  } catch {
    // ignore
  }
}
