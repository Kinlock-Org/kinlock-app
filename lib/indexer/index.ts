/**
 * Indexer list API, for LISTS ONLY (AGENTS.md §8.3, hard rule 3). Money-moving pages read the
 * chain through lib/sdk. Called from server components, so the browser never needs CORS.
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
