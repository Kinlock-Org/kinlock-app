import { describe, expect, it } from "vitest";
import {
  formatDateTimeUtcAndLocal,
  formatLocalCurrency,
  formatTokenAmount,
  shortAddress,
} from "./format";

describe("formatTokenAmount", () => {
  it.each([
    ["en", "1250.5", "1,250.50"],
    ["de", "1250.5", "1.250,50"],
    ["hi", "1250000.5", "12,50,000.50"],
    ["en", "0.0000001", "0.0000001"],
  ])("%s %s → %s", (locale, decimal, expected) => {
    expect(formatTokenAmount(decimal, locale)).toBe(expected);
  });

  it("keeps every digit of a huge amount (formats the string, not a float)", () => {
    expect(formatTokenAmount("17014118346046923173168730371588.4105727", "en")).toBe(
      "17,014,118,346,046,923,173,168,730,371,588.4105727",
    );
  });

  it("uses the locale's own digits (Arabic)", () => {
    expect(formatTokenAmount("12.5", "ar-EG")).toMatch(/[٠-٩]/);
  });
});

describe("formatLocalCurrency", () => {
  it.each([
    ["USD", "en", "1234.5", "$1,234.50"],
    ["JPY", "en", "1234", "¥1,234"], // zero-decimal currency
    ["KWD", "en", "1.5", "KWD 1.500"], // three-decimal currency
  ])("%s", (currency, locale, decimal, expected) => {
    expect(formatLocalCurrency(decimal, currency, locale).replace(/ /g, " ")).toBe(expected);
  });
});

describe("formatDateTimeUtcAndLocal", () => {
  it("shows the same instant in UTC and the viewer's zone", () => {
    const { utc, local } = formatDateTimeUtcAndLocal(1_800_000_000n, "en", "Africa/Lagos");
    expect(utc).toMatch(/UTC/);
    expect(utc).toMatch(/8:00/); // 2027-01-15 08:00 UTC
    expect(local).toMatch(/9:00/); // UTC+1
  });
});

describe("shortAddress", () => {
  it("keeps the start and end of an address", () => {
    expect(shortAddress("GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5")).toBe(
      "GBBD47…FLA5",
    );
  });
});
