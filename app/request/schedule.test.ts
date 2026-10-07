import { describe, expect, it } from "vitest";
import { nextRow, outOfOrder, totalOf, unixSecondsOf } from "./schedule";

describe("request schedule helpers", () => {
  it("reads a date as midnight UTC", () => {
    expect(unixSecondsOf("2026-10-07")).toBe(1791331200n);
  });

  it("totals exact decimal amounts, or null while one is invalid", () => {
    const rows = [
      { key: 0, amount: "150.25", date: "2026-10-07" },
      { key: 1, amount: " 0.0000001 ", date: "2026-10-08" },
    ];
    expect(totalOf(rows)).toBe("150.2500001");
    expect(totalOf([{ key: 0, amount: "1.12345678", date: "2026-10-07" }])).toBeNull();
    expect(totalOf([{ key: 0, amount: "abc", date: "2026-10-07" }])).toBeNull();
  });

  it("flags dates that go backwards, allows equal dates", () => {
    expect(outOfOrder([1n, 1n, 2n])).toBe(false);
    expect(outOfOrder([2n, 1n])).toBe(true);
    expect(outOfOrder([])).toBe(false);
  });

  it("adds a row with a fresh key and the previous date", () => {
    expect(nextRow([{ key: 4, amount: "1", date: "2026-11-01" }])).toEqual({
      key: 5,
      amount: "",
      date: "2026-11-01",
    });
  });
});
