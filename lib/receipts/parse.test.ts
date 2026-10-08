import { describe, expect, it } from "vitest";
import { isValidEventIndex, isValidTxHash, parseVerifyInput } from "./parse";

const TX_HASH = "ab".repeat(32);

describe("isValidTxHash", () => {
  it("accepts 64 lowercase hex characters", () => {
    expect(isValidTxHash(TX_HASH)).toBe(true);
  });
  it("rejects wrong length, uppercase, and non-hex", () => {
    expect(isValidTxHash(TX_HASH.slice(0, 63))).toBe(false);
    expect(isValidTxHash(TX_HASH.toUpperCase())).toBe(false);
    expect(isValidTxHash(`${TX_HASH.slice(0, 63)}g`)).toBe(false);
    expect(isValidTxHash("")).toBe(false);
  });
});

describe("isValidEventIndex", () => {
  it("accepts zero and positive whole numbers", () => {
    expect(isValidEventIndex("0")).toBe(true);
    expect(isValidEventIndex("12")).toBe(true);
  });
  it("rejects negative, decimal, and non-numeric input", () => {
    expect(isValidEventIndex("-1")).toBe(false);
    expect(isValidEventIndex("1.5")).toBe(false);
    expect(isValidEventIndex("abc")).toBe(false);
    expect(isValidEventIndex("")).toBe(false);
  });
});

describe("parseVerifyInput", () => {
  it("parses a bare transaction hash with a separate event number", () => {
    expect(parseVerifyInput(TX_HASH, "3")).toEqual({ ok: true, txHash: TX_HASH, eventIndex: 3 });
  });

  it("parses a full receipt path, ignoring the event number field", () => {
    expect(parseVerifyInput(`/r/${TX_HASH}/5`, "")).toEqual({
      ok: true,
      txHash: TX_HASH,
      eventIndex: 5,
    });
  });

  it("parses a full receipt link with an origin", () => {
    expect(parseVerifyInput(`https://kinlock.example/r/${TX_HASH}/0`, "")).toEqual({
      ok: true,
      txHash: TX_HASH,
      eventIndex: 0,
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseVerifyInput(`  ${TX_HASH}  `, " 2 ")).toEqual({
      ok: true,
      txHash: TX_HASH,
      eventIndex: 2,
    });
  });

  it("rejects an invalid hash or link with an input error", () => {
    expect(parseVerifyInput("not-a-hash", "0")).toEqual({ ok: false, error: "input" });
    expect(parseVerifyInput("", "0")).toEqual({ ok: false, error: "input" });
  });

  it("rejects a bare hash with a missing or invalid event number", () => {
    expect(parseVerifyInput(TX_HASH, "")).toEqual({ ok: false, error: "eventIndex" });
    expect(parseVerifyInput(TX_HASH, "-1")).toEqual({ ok: false, error: "eventIndex" });
    expect(parseVerifyInput(TX_HASH, "1.5")).toEqual({ ok: false, error: "eventIndex" });
  });
});
