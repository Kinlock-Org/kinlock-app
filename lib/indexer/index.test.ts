import { afterEach, describe, expect, it, vi } from "vitest";

const { publicConfig } = vi.hoisted(() => ({ publicConfig: vi.fn() }));
vi.mock("@/lib/sdk", () => ({ publicConfig }));
publicConfig.mockReturnValue({ NEXT_PUBLIC_INDEXER_URL: "https://indexer.example" });

const { indexerLagging, listPayees, listLocks, MOCK_PAYEES } = await import("./index");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("indexerLagging", () => {
  it("is false when the indexer reports ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ok",
          indexedLedger: 10,
          latestLedger: 10,
          lagLedgers: 0,
          lastBatchAt: "2026-10-08T00:00:00.000Z",
        }),
      }),
    );
    expect(await indexerLagging()).toBe(false);
  });

  it("is true when the indexer reports lagging", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "lagging",
          indexedLedger: 5,
          latestLedger: 20,
          lagLedgers: 15,
          lastBatchAt: "2026-10-08T00:00:00.000Z",
        }),
      }),
    );
    expect(await indexerLagging()).toBe(true);
  });

  it("is true when the health endpoint returns a non-ok HTTP status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await indexerLagging()).toBe(true);
  });

  it("is true when the health check itself fails (never hides a real lag)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await indexerLagging()).toBe(true);
  });

  it("is false when no indexer URL is configured", async () => {
    publicConfig.mockReturnValueOnce({ NEXT_PUBLIC_INDEXER_URL: undefined });
    expect(await indexerLagging()).toBe(false);
  });
});

describe("listPayees", () => {
  it("returns indexer payees when the indexer responds successfully", async () => {
    const mockPayee = {
      payeeId: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      slug: "custom-academy",
      displayName: "Custom Academy",
      category: "School",
      status: "Active",
      payout: "GAYO5N5L7CH5MQF255ZAR57N4OB6H6GZ6J33A7264O6M3D6GFF5K3L4O",
      attesterHandle: "custom-attester",
      country: "KE",
      localCurrency: "KES",
      city: "Nairobi",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          payees: [mockPayee],
          next: null,
        }),
      }),
    );
    const payees = await listPayees();
    expect(payees).toEqual([mockPayee]);
  });

  it("falls back to mock payees when indexer returns a non-ok HTTP status (e.g. 404)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const payees = await listPayees();
    expect(payees).toEqual(MOCK_PAYEES);
  });

  it("falls back to mock payees when indexer fetch rejects (e.g. network down)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));
    const payees = await listPayees();
    expect(payees).toEqual(MOCK_PAYEES);
  });

  it("falls back to mock payees when no indexer URL is configured", async () => {
    publicConfig.mockReturnValueOnce({ NEXT_PUBLIC_INDEXER_URL: undefined });
    const payees = await listPayees();
    expect(payees).toEqual(MOCK_PAYEES);
  });

  it("uses mock payees when NEXT_PUBLIC_USE_MOCK_DATA is 'true'", async () => {
    const prev = process.env.NEXT_PUBLIC_USE_MOCK_DATA;
    try {
      process.env.NEXT_PUBLIC_USE_MOCK_DATA = "true";
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      const payees = await listPayees();
      expect(payees).toEqual(MOCK_PAYEES);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      process.env.NEXT_PUBLIC_USE_MOCK_DATA = prev;
    }
  });
});

describe("listLocks", () => {
  it("returns indexer locks when the indexer responds successfully", async () => {
    const mockLock = {
      id: "1",
      sender: "GBBUI4N57S3TBUZTUKQPKWY5DERT2ZHQN4LLQZ747W7CD5HU3FGHWDH3",
      payeeId: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      payout: "GAYO5N5L7CH5MQF255ZAR57N4OB6H6GZ6J33A7264O6M3D6GFF5K3L4O",
      token: "CCSHDQFRYFC3AHV5NE6ULQW6X2CMG5RPANBORDXJGSUD6UKECASJQBRI",
      total: "100000000",
      released: "0",
      returned: "0",
      refHash: "dee2634ab9acdbfff6fe5c0595fcda66c0897d1c6968c290745da4f384e3ee5e",
      state: "Open",
      endReason: null,
      expiresAt: "2026-10-24T12:00:00.000Z",
      createdAt: "2026-10-17T09:00:00.000Z",
      createdTx: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          locks: [mockLock],
          next: null,
        }),
      }),
    );
    const locks = await listLocks(
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    );
    expect(locks).toEqual([mockLock]);
  });

  it("returns empty array when indexer returns a non-ok HTTP status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const locks = await listLocks("some-payee");
    expect(locks).toEqual([]);
  });

  it("returns empty array when indexer fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const locks = await listLocks("some-payee");
    expect(locks).toEqual([]);
  });
});
