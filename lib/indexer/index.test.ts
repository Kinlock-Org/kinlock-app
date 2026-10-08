import { afterEach, describe, expect, it, vi } from "vitest";

const { publicConfig } = vi.hoisted(() => ({ publicConfig: vi.fn() }));
vi.mock("@/lib/sdk", () => ({ publicConfig }));
publicConfig.mockReturnValue({ NEXT_PUBLIC_INDEXER_URL: "https://indexer.example" });

const { indexerLagging } = await import("./index");

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
});
