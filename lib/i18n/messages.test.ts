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

  // RCP-3 & Hard Rule 7: Prevent overclaiming and unjustified delivery/guarantee claims
  it("never uses wording that overclaims", () => {
    const all = JSON.stringify(en).toLowerCase();
    const bannedPhrases = [
      "proof of use",
      "service delivered",
      "guaranteed delivery",
      "guaranteed payment",
      "unconditional guarantee",
      "fully delivered",
      "verified use of funds",
      "100% secure",
      "zero risk",
      "proof of delivery",
      "verified delivery",
      "unconditional refund",
      "unconditional release",
    ];

    for (const banned of bannedPhrases) {
      expect(all).not.toContain(banned);
    }
  });

  // PRD E30 & RCP-3: Low-literacy accessibility & concise sentence guard
  it("bounds maximum word count per string (max 30 words)", () => {
    for (const key of keysOf(en)) {
      const text = t(key as MessageKey);
      const wordCount = text.trim().split(/\s+/).length;
      expect(
        wordCount,
        `Key "${key}" exceeds word count bound (${wordCount} > 30 words)`,
      ).toBeLessThanOrEqual(30);
    }
  });
});
