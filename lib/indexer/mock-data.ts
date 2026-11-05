import type { IndexedPayee } from "./index";

/**
 * Mock/fixture payees used when an indexer service is unreachable or not yet configured.
 * These match active fixture entities registered on the Soroban testnet contract,
 * allowing full send and request flows without requiring an external indexer.
 */
export const MOCK_PAYEES: IndexedPayee[] = [
  {
    payeeId: "4485665bae55d2562f20ad82cec50c8aaa99ddf613b982509711a6b474ded0ba",
    slug: "ke-kinlock-test-school",
    displayName: "Kinlock Test School (fixture)",
    category: "School",
    status: "Active",
    payout: "GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM",
    attesterHandle: "kinlock-testnet-attester-1",
    country: "KE",
    localCurrency: "KES",
    city: "Nairobi",
  },
  {
    payeeId: "a7815d079f7663968e7ce11c3765009a09c5daccb4a123a9102d3f7567d43866",
    slug: "ph-kinlock-test-rentals",
    displayName: "Kinlock Test Rentals (fixture)",
    category: "Rent",
    status: "Active",
    payout: "GBXKOYQ4MJ6UJGQBFXVXOP7XL7SKKJTFTYJUSNREP5FW4IHXPMWY2WSX",
    attesterHandle: "kinlock-testnet-attester-1",
    country: "PH",
    localCurrency: "PHP",
    city: "Quezon City",
  },
  {
    payeeId: "3e7236118c83eb3bd37927155be21cc90ada773aaca86380d28cea5f712be2f1",
    slug: "gh-kinlock-test-academy",
    displayName: "Kinlock Test Academy (fixture)",
    category: "School",
    status: "Active",
    payout: "GDPUY733T3UNZWG4EQMEBHBDGKD33YSFPOI2RB4AIK2JMOENKEXWK7ZG",
    attesterHandle: "kinlock-testnet-attester-1",
    country: "GH",
    localCurrency: "GHS",
    city: "Accra",
  },
];
