/**
 * Indexer list API, for LISTS ONLY (AGENTS.md §8.3, hard rule 3). Money-moving pages read the
 * chain through lib/sdk. `listPayees` runs from server components; `listLocks` also runs from the
 * browser (the payee dashboard doesn't know which payeeId to ask for until a wallet connects), so
 * its base URL follows the same same-origin-in-the-browser rule `lib/sdk.ts`'s `kinlockConfig`
 * uses, reached through `next.config.ts`'s `/locks` rewrite. Neither call needs CORS.
 */
import { z } from "zod";
import { publicConfig } from "@/lib/sdk";

const PayeeSchema = z.object({
  payeeId: z.string(),
  slug: z.string().nullable(),
  displayName: z.string().nullable(),
  category: z.enum(["School", "Rent"]),
  status: z.enum(["Active", "Suspended", "Revoked"]),
  payout: z.string(),
  attesterHandle: z.string().nullable(),
  country: z.string().nullable(),
  localCurrency: z.string().nullable(),
  city: z.string().nullable(),
});
export type IndexedPayee = z.infer<typeof PayeeSchema>;

const PayeesResponse = z.object({
  payees: z.array(PayeeSchema),
  next: z.string().nullable(),
});

/** Every payee the indexer knows, following pagination. Throws if the indexer can't be read. */
export async function listPayees(): Promise<IndexedPayee[]> {
  const base = publicConfig().NEXT_PUBLIC_INDEXER_URL;
  const all: IndexedPayee[] = [];
  let after: string | null = null;
  do {
    const url = new URL("/payees", base);
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error(`indexer /payees: HTTP ${response.status}`);
    const page = PayeesResponse.parse(await response.json());
    all.push(...page.payees);
    after = page.next;
  } while (after);
  return all;
}

/** Payees a sender can pay: Active, with registry display data joined (hash-bound). */
export const payable = (payees: IndexedPayee[]) =>
  payees.filter((p) => p.status === "Active" && p.displayName !== null);

export const LOCK_STATES = ["Open", "Completed", "Refunded", "Declined"] as const;

const IndexedLockSchema = z.object({
  id: z.string(),
  sender: z.string(),
  payeeId: z.string(),
  payout: z.string(),
  token: z.string(),
  total: z.string(),
  released: z.string(),
  returned: z.string(),
  refHash: z.string(),
  state: z.enum(LOCK_STATES),
  endReason: z.string().nullable(),
  expiresAt: z.string(),
  createdAt: z.string(),
  createdTx: z.string(),
});
/** A lock as the list API returns it: ISO-8601 times, decimal-string amounts. Display only;
 *  distinct from `@kinlock/sdk`'s chain-read `Lock` (hard rule 3: that one is the one that counts
 *  for money-moving decisions). */
export type IndexedLock = z.infer<typeof IndexedLockSchema>;

const LocksResponse = z.object({
  locks: z.array(IndexedLockSchema),
  next: z.string().nullable(),
});

function indexerBase(): string {
  return typeof window === "undefined"
    ? (publicConfig().NEXT_PUBLIC_INDEXER_URL ?? "")
    : window.location.origin;
}

/** A payee's locks, newest first, optionally narrowed to one state. Throws if the indexer can't be read. */
export async function listLocks(
  payeeId: string,
  state?: (typeof LOCK_STATES)[number],
): Promise<IndexedLock[]> {
  const base = indexerBase();
  const all: IndexedLock[] = [];
  let before: string | null = null;
  do {
    const url = new URL("/locks", base);
    url.searchParams.set("payee_id", payeeId);
    if (state) url.searchParams.set("state", state);
    url.searchParams.set("limit", "100");
    if (before) url.searchParams.set("before", before);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`indexer /locks: HTTP ${response.status}`);
    const page = LocksResponse.parse(await response.json());
    all.push(...page.locks);
    before = page.next;
  } while (before);
  return all;
}
