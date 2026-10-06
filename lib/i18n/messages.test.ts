import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { type MessageKey, t } from "./messages";

const keysOf = (node: unknown, prefix = ""): string[] =>
  typeof node === "string"
    ? [prefix]
    : Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
        keysOf(v, prefix ? `${prefix}.${k}` : k),
      );

describe("messages", () => {
  // Hard rule 7 (AGENTS.md §3): receipts say exactly this, nothing stronger.
  it("keeps the receipt wording exact", () => {
    expect(t("receipt.headline")).toBe("Payment to verified payee");
  });

  it("resolves every key to non-empty text", () => {
    for (const key of keysOf(en)) {
      const text = t(key as MessageKey);
      expect(typeof text, key).toBe("string");
      expect(text.length, key).toBeGreaterThan(0);
    }
  });

  it("never uses wording that overclaims", () => {
    const all = JSON.stringify(en).toLowerCase();
    for (const banned of ["proof of use", "service delivered"]) {
      expect(all).not.toContain(banned);
    }
  });
});
