import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Money and time must only be rendered through shared components: AmountDisplay, AssetLabel,
 * and DateTimeDisplay (AGENTS.md §8.3, roadmap M3-15, Issue #40).
 * Hand-rolled formatters, direct Intl calls, or direct calls to lib/i18n/format helpers
 * are strictly forbidden across app/ and components/.
 */
const roots = ["app", "components"];

const codeFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return codeFiles(path);
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });

const forbiddenPatterns = [
  /\bIntl\.NumberFormat\b/,
  /\bIntl\.DateTimeFormat\b/,
  /\.toLocaleString\(/,
  /\.toFixed\(/,
  /\bformatTokenAmount\(/,
  /\bformatDateTimeUtcAndLocal\(/,
  /\bformatLocalCurrency\(/,
];

const isAllowlisted = (filePath: string): boolean => {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.startsWith("components/money/") ||
    normalized.startsWith("components/time/") ||
    normalized === "lib/i18n/format.ts"
  );
};

const findFormattingViolations = (source: string): string[] => {
  const violations: string[] = [];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      violations.push(pattern.source);
    }
  }
  return violations;
};

describe("money and time display format guard", () => {
  const files = roots
    .flatMap(codeFiles)
    .filter((f) => !f.includes(".test.") && !f.includes(".spec."));

  it("scans the app and components trees", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)("%s routes money/time only through shared components", (file) => {
    if (isAllowlisted(file)) return;
    const content = readFileSync(file, "utf8");
    const violations = findFormattingViolations(content);
    expect(violations).toEqual([]);
  });

  it("would catch a hand-rolled formatter or direct helper call", () => {
    expect(findFormattingViolations("const n = new Intl.NumberFormat('en');")).toContain(
      "\\bIntl\\.NumberFormat\\b",
    );
    expect(findFormattingViolations("const d = new Intl.DateTimeFormat('en');")).toContain(
      "\\bIntl\\.DateTimeFormat\\b",
    );
    expect(findFormattingViolations("const s = (123).toLocaleString();")).toContain(
      "\\.toLocaleString\\(",
    );
    expect(findFormattingViolations("const s = amount.toFixed(2);")).toContain("\\.toFixed\\(");
    expect(findFormattingViolations("const s = formatTokenAmount('10', 'en');")).toContain(
      "\\bformatTokenAmount\\(",
    );
    expect(findFormattingViolations("const s = formatDateTimeUtcAndLocal(10n, 'en');")).toContain(
      "\\bformatDateTimeUtcAndLocal\\(",
    );
    expect(findFormattingViolations("const s = formatLocalCurrency('10', 'USD', 'en');")).toContain(
      "\\bformatLocalCurrency\\(",
    );
  });
});
