/**
 * Known payees joined with live chain state. Interim source for `/send` and `/request` while no
 * indexer is deployed (`M2-18`); `getPayee` is a chain read (hard rule 3: chain is truth), so
 * `status` and `payout` here are never guessed or taken from the committed snapshot. Mirrors the
 * canonicalization and meta_hash binding kinlock-registry's own `scripts/registry.ts` and
 * kinlock-sdk's indexer (`services/indexer/src/registry/sync.ts`) already use, so a payee's
 * display fields are shown only when this snapshot's hash of the full record still matches what
 * the attester actually registered on chain.
 */
import { createHash } from "node:crypto";
import type { IndexedPayee } from "@/lib/indexer";
import { getPayee } from "@/lib/sdk";
import { KNOWN_PAYEES, type KnownPayee } from "./known";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function canonicalize(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map(
        (k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, Json>)[k] as Json)}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const sha256Hex = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

/** The on-chain payee ID: SHA-256 of the slug (matches kinlock-registry's `payeeId`). */
export const payeeIdOf = (slug: string): string => sha256Hex(slug);

/** SHA-256 of the canonical JSON (matches kinlock-registry's `metaHash`). */
const metaHashOf = (payee: KnownPayee): string => sha256Hex(canonicalize(payee as unknown as Json));

/** Known payees the chain actually confirms exist and are bound to this snapshot's data. */
export async function listKnownPayees(): Promise<IndexedPayee[]> {
  const joined = await Promise.all(KNOWN_PAYEES.map(joinWithChain));
  return joined.filter((p): p is IndexedPayee => p !== null);
}

async function joinWithChain(p: KnownPayee): Promise<IndexedPayee | null> {
  const payeeId = payeeIdOf(p.slug);
  const onChain = await getPayee(payeeId).catch(() => null);
  if (!onChain) return null;
  const bound = onChain.metaHash === metaHashOf(p) && onChain.category === p.category;
  return {
    payeeId,
    slug: bound ? p.slug : null,
    displayName: bound ? p.display_name : null,
    category: onChain.category,
    status: onChain.status,
    payout: onChain.payout,
    attesterHandle: null,
    country: bound ? p.country : null,
    localCurrency: bound ? p.local_currency : null,
    city: bound ? p.city : null,
  };
}
