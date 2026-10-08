import type { Payee } from "@kinlock/sdk";
import { describe, expect, it, vi } from "vitest";
import { KNOWN_PAYEES } from "./known";

const { getPayee } = vi.hoisted(() => ({ getPayee: vi.fn() }));
vi.mock("@/lib/sdk", () => ({ getPayee }));

const { listKnownPayees, payeeIdOf } = await import("./registry");

const chainPayee = (over: Partial<Payee> = {}): Payee => ({
  payout: "GDPUY733T3UNZWG4EQMEBHBDGKD33YSFPOI2RB4AIK2JMOENKEXWK7ZG",
  category: "School",
  status: "Active",
  statusChangedAt: 0n,
  attester: "GC23HSHHWSCKFAGMJF5JWXJRHAJCBZGZZMEN7TD5YQBHYBQ3ITNCO6FX",
  metaHash: "b91bbf10a4b5ac34c0ff345817423cbf8ade78ecf9bf27fe50f2cc91ebc135b6",
  registeredAt: 0n,
  ...over,
});

describe("payeeIdOf", () => {
  it("matches kinlock-registry's own payee_id for each known fixture", () => {
    // Computed independently with `pnpm hash` in kinlock-registry against the source files.
    expect(payeeIdOf("ng-kinlock-test-academy")).toBe(
      "3e7236118c83eb3bd37927155be21cc90ada773aaca86380d28cea5f712be2f1",
    );
    expect(payeeIdOf("ke-kinlock-test-school")).toBe(
      "4485665bae55d2562f20ad82cec50c8aaa99ddf613b982509711a6b474ded0ba",
    );
    expect(payeeIdOf("ph-kinlock-test-rentals")).toBe(
      "a7815d079f7663968e7ce11c3765009a09c5daccb4a123a9102d3f7567d43866",
    );
  });
});

describe("listKnownPayees", () => {
  it("shows display fields only when the on-chain meta_hash matches this snapshot", async () => {
    getPayee.mockImplementation(async (payeeId: string) =>
      payeeId === payeeIdOf("ng-kinlock-test-academy")
        ? chainPayee({
            metaHash: "b91bbf10a4b5ac34c0ff345817423cbf8ade78ecf9bf27fe50f2cc91ebc135b6",
          })
        : null,
    );
    const result = await listKnownPayees();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      slug: "ng-kinlock-test-academy",
      displayName: "Kinlock Test Academy (fixture)",
      country: "NG",
      status: "Active",
    });
  });

  it("clears display fields when the on-chain meta_hash doesn't match (edited after registration)", async () => {
    getPayee.mockResolvedValue(chainPayee({ metaHash: "0".repeat(64) }));
    const result = await listKnownPayees();
    for (const p of result) {
      expect(p.slug).toBeNull();
      expect(p.displayName).toBeNull();
      expect(p.country).toBeNull();
    }
  });

  it("drops payees the chain has never heard of", async () => {
    getPayee.mockResolvedValue(null);
    expect(await listKnownPayees()).toEqual([]);
  });

  it("never throws when a chain read fails; drops that payee instead", async () => {
    getPayee.mockRejectedValue(new Error("rpc down"));
    await expect(listKnownPayees()).resolves.toEqual([]);
  });

  it("reflects live chain status, not a hard-coded value", async () => {
    getPayee.mockResolvedValue(chainPayee({ status: "Suspended" }));
    const result = await listKnownPayees();
    expect(result.every((p) => p.status === "Suspended")).toBe(true);
  });

  it("covers every known fixture (sanity: the snapshot isn't empty)", () => {
    expect(KNOWN_PAYEES.length).toBeGreaterThanOrEqual(3);
  });
});
