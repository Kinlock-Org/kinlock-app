import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  exportClaimLinks,
  getPendingSubmission,
  type KeyValueStore,
  listClaimLinks,
  listPendingSubmissions,
  newClaimLink,
  PENDING_STORAGE_KEY,
  removeClaimLink,
  removePendingSubmission,
  STORAGE_KEY,
  saveClaimLink,
  savePendingSubmission,
} from "./index";

const SALT = "AAECAwQFBgcICQoLDA0ODw"; // 16 bytes, base64url
const ORIGIN = "https://app.example";

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe("claim links (browser-only storage)", () => {
  it("puts the reference and salt only in the fragment", () => {
    const url = newClaimLink(ORIGIN, 7n, "INV-42", SALT);
    const u = new URL(url);
    expect(u.pathname).toBe("/claim/7");
    expect(u.search).toBe("");
    expect(u.hash).toContain("r=INV-42");
    expect(u.hash).toContain(`s=${SALT}`);
  });

  it("saves, lists newest first, replaces per lock, and removes", () => {
    const store = memoryStore();
    saveClaimLink(store, newClaimLink(ORIGIN, 1n, "A", SALT), new Date("2026-10-07T10:00:00Z"));
    saveClaimLink(store, newClaimLink(ORIGIN, 2n, "B", SALT), new Date("2026-10-07T11:00:00Z"));
    saveClaimLink(store, newClaimLink(ORIGIN, 1n, "A2", SALT), new Date("2026-10-07T12:00:00Z"));
    const links = listClaimLinks(store);
    expect(links.map((l) => l.lockId)).toEqual(["1", "2"]);
    expect(links[0]?.url).toContain("r=A2");
    removeClaimLink(store, "1");
    expect(listClaimLinks(store).map((l) => l.lockId)).toEqual(["2"]);
  });

  it("ignores corrupt or foreign data instead of failing", () => {
    const store = memoryStore();
    store.setItem(STORAGE_KEY, "{not json");
    expect(listClaimLinks(store)).toEqual([]);
    store.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          lockId: "3",
          url: `https://evil.example/claim/4#r=x&s=${SALT}`,
          savedAt: "2026-10-07T00:00:00Z",
        },
        { lockId: "5", url: "not a url", savedAt: "2026-10-07T00:00:00Z" },
      ]),
    );
    expect(listClaimLinks(store)).toEqual([]);
  });

  it("reports when storage refuses a write (e.g. quota)", () => {
    const store: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(saveClaimLink(store, newClaimLink(ORIGIN, 1n, "A", SALT))).toBe(false);
  });

  it("exports a self-describing file of the saved links", () => {
    const store = memoryStore();
    saveClaimLink(
      store,
      newClaimLink(ORIGIN, 9n, "RENT-OCT", SALT),
      new Date("2026-10-07T10:00:00Z"),
    );
    const file = JSON.parse(exportClaimLinks(store, new Date("2026-10-07T12:00:00Z")));
    expect(file).toMatchObject({
      kind: "kinlock-claim-links",
      version: 1,
      exportedAt: "2026-10-07T12:00:00.000Z",
    });
    expect(file.links).toHaveLength(1);
    expect(file.links[0].url).toContain("#r=RENT-OCT");
  });

  it("saves, retrieves, lists, and removes pending submissions safely in browser storage", () => {
    const store = memoryStore();
    const sub1 = {
      id: "sub-1",
      reference: "INV-1",
      salt: SALT,
      mode: "verified" as const,
      recipientOrPayee: "payee-1",
      createdAt: "2026-10-07T10:00:00Z",
    };
    const sub2 = {
      id: "sub-2",
      reference: "INV-2",
      salt: SALT,
      mode: "direct" as const,
      recipientOrPayee: "GABC...",
      txHash: "11".repeat(32),
      createdAt: "2026-10-07T11:00:00Z",
    };
    expect(savePendingSubmission(store, sub1)).toBe(true);
    expect(savePendingSubmission(store, sub2)).toBe(true);

    const list = listPendingSubmissions(store);
    expect(list.map((s) => s.id)).toEqual(["sub-2", "sub-1"]);

    expect(getPendingSubmission(store, "sub-1")?.reference).toBe("INV-1");
    expect(getPendingSubmission(store, "11".repeat(32))?.reference).toBe("INV-2");
    expect(getPendingSubmission(store)?.id).toBe("sub-2");

    removePendingSubmission(store, "11".repeat(32));
    expect(listPendingSubmissions(store).map((s) => s.id)).toEqual(["sub-1"]);

    removePendingSubmission(store, "sub-1");
    expect(listPendingSubmissions(store)).toEqual([]);

    store.setItem(PENDING_STORAGE_KEY, "invalid-json");
    expect(listPendingSubmissions(store)).toEqual([]);
    expect(getPendingSubmission(store)).toBeNull();

    const failingStore: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
    };
    expect(savePendingSubmission(failingStore, sub1)).toBe(false);
  });

  it("never touches the network", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const store = memoryStore();
    saveClaimLink(store, newClaimLink(ORIGIN, 1n, "A", SALT));
    listClaimLinks(store);
    exportClaimLinks(store);
    removeClaimLink(store, "1");
    expect(fetchSpy).not.toHaveBeenCalled();
    // And the module has no network code to begin with.
    const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
    for (const api of [
      "fetch(",
      "XMLHttpRequest",
      "sendBeacon",
      "WebSocket",
      "EventSource",
      "console.",
    ]) {
      expect(source, api).not.toContain(api);
    }
  });
});
