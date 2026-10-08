/**
 * A committed snapshot of kinlock-registry's payees, used only until an indexer is deployed
 * (`M2-18`, still `TODO`). Never trusted directly: `registry.ts` verifies each entry's `meta_hash`
 * against what's actually on chain before showing any of its fields (same binding the real
 * indexer's registry sync enforces in `kinlock-sdk`'s `services/indexer/src/registry/sync.ts`).
 *
 * Synced by hand from `kinlock-registry/fixtures/payees/` on 2026-10-06 (fictional test
 * institutions for testnet only, per that repo's `fixtures/README.md`). Replace this file's
 * contents, or the whole module, once `M2-18` ships.
 */
export interface KnownPayee {
  slug: string;
  display_name: string;
  category: "School" | "Rent";
  country: string;
  local_currency: string;
  city: string;
  payout_address: string;
  attester: string;
  verified_at: string;
}

export const KNOWN_PAYEES: readonly KnownPayee[] = [
  {
    slug: "ng-kinlock-test-academy",
    display_name: "Kinlock Test Academy (fixture)",
    category: "School",
    country: "NG",
    local_currency: "NGN",
    city: "Ibadan",
    payout_address: "GDPUY733T3UNZWG4EQMEBHBDGKD33YSFPOI2RB4AIK2JMOENKEXWK7ZG",
    attester: "kinlock-testnet-attester-1",
    verified_at: "2026-10-06",
  },
  {
    slug: "ke-kinlock-test-school",
    display_name: "Kinlock Test School (fixture)",
    category: "School",
    country: "KE",
    local_currency: "KES",
    city: "Nairobi",
    payout_address: "GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM",
    attester: "kinlock-testnet-attester-1",
    verified_at: "2026-10-06",
  },
  {
    slug: "ph-kinlock-test-rentals",
    display_name: "Kinlock Test Rentals (fixture)",
    category: "Rent",
    country: "PH",
    local_currency: "PHP",
    city: "Quezon City",
    payout_address: "GBXKOYQ4MJ6UJGQBFXVXOP7XL7SKKJTFTYJUSNREP5FW4IHXPMWY2WSX",
    attester: "kinlock-testnet-attester-1",
    verified_at: "2026-10-06",
  },
];
