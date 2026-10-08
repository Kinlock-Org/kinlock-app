import type { ClaimLinkParts } from "@kinlock/sdk";
import { describe, expect, it } from "vitest";
import type { IndexedLock, IndexedPayee } from "@/lib/indexer";
import { byNewest, findByReference, matchingPayeeIds } from "./payee-logic";

const payee = (over: Partial<IndexedPayee> = {}): IndexedPayee => ({
  payeeId: "aa".repeat(32),
  slug: "test-school",
  displayName: "Test School",
  category: "School",
  status: "Active",
  payout: "GDPUY733T3UNZWG4EQMEBHBDGKD33YSFPOI2RB4AIK2JMOENKEXWK7ZG",
  attesterHandle: "test-attester",
  country: "NG",
  localCurrency: "NGN",
  city: "Ibadan",
  ...over,
});

const lock = (over: Partial<IndexedLock> = {}): IndexedLock => ({
  id: "1",
  sender: "GBBUI4N57S3TBUZTUKQPKWY5DERT2ZHQN4LLQZ747W7CD5HU3FGHWDH3",
  payeeId: "aa".repeat(32),
  payout: "GDPUY733T3UNZWG4EQMEBHBDGKD33YSFPOI2RB4AIK2JMOENKEXWK7ZG",
  token: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  total: "1000000",
  released: "0",
  returned: "0",
  refHash: "bb".repeat(32),
  state: "Open",
  endReason: null,
  expiresAt: "2026-12-01T00:00:00.000Z",
  createdAt: "2026-10-01T00:00:00.000Z",
  createdTx: "cc".repeat(32),
  ...over,
});

describe("matchingPayeeIds", () => {
  it("finds every payeeId this wallet is the payout address for", () => {
    const payees = [
      payee({ payeeId: "aa".repeat(32), payout: "GADDR1" }),
      payee({ payeeId: "bb".repeat(32), payout: "GADDR2" }),
      payee({ payeeId: "cc".repeat(32), payout: "GADDR1" }),
    ];
    expect(matchingPayeeIds(payees, "GADDR1")).toEqual(["aa".repeat(32), "cc".repeat(32)]);
  });

  it("returns nothing for a wallet that isn't any payee's payout address", () => {
    expect(matchingPayeeIds([payee()], "GSOMEONE_ELSE")).toEqual([]);
  });
});

describe("byNewest", () => {
  it("sorts locks by id, descending", () => {
    const locks = [lock({ id: "3" }), lock({ id: "10" }), lock({ id: "1" })];
    expect(byNewest(locks).map((l) => l.id)).toEqual(["10", "3", "1"]);
  });
});

describe("findByReference", () => {
  const parse = (link: string): ClaimLinkParts => {
    if (link === "bad") throw new Error("not a claim link");
    return { lockId: 1n, reference: "invoice-42", salt: "s4lt" };
  };
  const computeRefHash = async (reference: string, salt: string) =>
    reference === "invoice-42" && salt === "s4lt" ? "bb".repeat(32) : "wrong-hash";

  it("returns none for an empty input", async () => {
    expect(await findByReference("", [lock()], parse, computeRefHash)).toEqual({ status: "none" });
    expect(await findByReference("   ", [lock()], parse, computeRefHash)).toEqual({
      status: "none",
    });
  });

  it("returns invalid when the link doesn't parse", async () => {
    expect(await findByReference("bad", [lock()], parse, computeRefHash)).toEqual({
      status: "invalid",
    });
  });

  it("finds the lock whose ref_hash and id both match", async () => {
    const locks = [lock({ id: "1", refHash: "bb".repeat(32) }), lock({ id: "2" })];
    expect(await findByReference("good-link", locks, parse, computeRefHash)).toEqual({
      status: "found",
      lockId: "1",
    });
  });

  it("reports not found when the hash matches but the lock isn't among those loaded", async () => {
    const locks = [lock({ id: "99", refHash: "zz".repeat(32) })];
    expect(await findByReference("good-link", locks, parse, computeRefHash)).toEqual({
      status: "notFound",
    });
  });

  it("reports not found when the lock id matches but the hash doesn't (wrong salt)", async () => {
    const wrongHash = async () => "mismatched";
    const locks = [lock({ id: "1", refHash: "bb".repeat(32) })];
    expect(await findByReference("good-link", locks, parse, wrongHash)).toEqual({
      status: "notFound",
    });
  });
});
