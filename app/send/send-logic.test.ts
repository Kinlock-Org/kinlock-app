import type { PreflightResult } from "@kinlock/sdk";
import { describe, expect, it } from "vitest";
import { dateOf, defaultExpiryDate, draftProblem, prefillFrom, verdict } from "./send-logic";

const NOW = 1_791_331_200n; // 2026-10-07T00:00:00Z
const PAYEE = "44".repeat(32);
const row = (amount: string, date: string, key = 0) => ({ key, amount, date });
const draft = (over = {}) => ({
  payeeId: PAYEE,
  reference: "INV-1",
  rows: [row("150", "2026-10-07")],
  expiryDate: "2026-11-07",
  ...over,
});

describe("draftProblem mirrors the contract's create_lock checks", () => {
  it("accepts a valid draft", () => {
    expect(draftProblem(draft(), NOW)).toBeNull();
  });

  it("flags each problem with its own message", () => {
    expect(draftProblem(draft({ payeeId: "" }), NOW)).toBe("pages.send.errorPayee");
    expect(draftProblem(draft({ reference: " " }), NOW)).toBe("pages.send.errorReference");
    expect(draftProblem(draft({ rows: [row("150", "")] }), NOW)).toBe("pages.send.errorDate");
    expect(draftProblem(draft({ rows: [row("1.123456789", "2026-10-07")] }), NOW)).toBe(
      "pages.send.errorAmount",
    );
    expect(draftProblem(draft({ rows: [row("0.5", "2026-10-07")] }), NOW)).toBe(
      "pages.send.errorMinimum",
    );
    expect(
      draftProblem(draft({ rows: [row("1", "2026-10-09"), row("1", "2026-10-08", 1)] }), NOW),
    ).toBe("pages.send.errorOrder");
    expect(draftProblem(draft({ rows: [row("1", "2026-12-01")] }), NOW)).toBe(
      "pages.send.errorUnlockAfterExpiry",
    );
    expect(draftProblem(draft({ expiryDate: "2026-10-07" }), NOW)).toBe(
      "pages.send.errorExpirySoon",
    );
    expect(draftProblem(draft({ expiryDate: "2027-06-01" }), NOW)).toBe(
      "pages.send.errorExpiryFar",
    );
  });

  it("accepts exactly the 1 USDC minimum", () => {
    expect(draftProblem(draft({ rows: [row("1", "2026-10-07")] }), NOW)).toBeNull();
  });
});

describe("defaultExpiryDate", () => {
  it("is 30 days after the last payment", () => {
    expect(defaultExpiryDate([row("1", "2026-11-01")], NOW)).toBe("2026-12-01");
  });

  it("stays inside the 149-day limit", () => {
    expect(defaultExpiryDate([row("1", "2027-02-25")], NOW)).toBe(dateOf(NOW + 148n * 86_400n));
  });
});

describe("prefillFrom (payment-request links)", () => {
  it("fills payee, reference and schedule from a request link", () => {
    const href = `https://app.example/send?payee=${PAYEE}&ref=INV-2026-0042&schedule=150.25%401793491200%2C99.75%401796083200`;
    expect(prefillFrom(href)).toEqual({
      payeeId: PAYEE,
      reference: "INV-2026-0042",
      rows: [row("150.25", "2026-11-01"), row("99.75", "2026-12-01", 1)],
    });
  });

  it("ignores a plain /send and a malformed link", () => {
    expect(prefillFrom("https://app.example/send")).toBeNull();
    expect(prefillFrom("https://app.example/send?payee=xyz&ref=a&schedule=1@1")).toBeNull();
  });
});

describe("verdict", () => {
  const r = (severity: "block" | "warn", status: "pass" | "fail" | "unknown"): PreflightResult => ({
    check: "sender_balance",
    severity,
    status,
    messageKey: "x",
  });
  it("blocks on a failed blocking check, asks to acknowledge a failed warning, else ok", () => {
    expect(verdict([r("block", "fail"), r("warn", "fail")])).toBe("blocked");
    expect(verdict([r("block", "pass"), r("warn", "fail")])).toBe("needsAcknowledgement");
    expect(verdict([r("block", "pass"), r("block", "unknown"), r("warn", "unknown")])).toBe("ok");
  });
});
