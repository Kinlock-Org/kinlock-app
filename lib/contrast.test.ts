import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * WCAG 2.1 relative luminance calculation (Formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance).
 */
function sRgbToLinear(c: number): number {
  const val = c / 255;
  return val <= 0.04045 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function composite(fgHex: string, bgHex: string, alpha: number): string {
  const fg = fgHex.replace("#", "");
  const bg = bgHex.replace("#", "");
  const r = Math.round(
    parseInt(fg.slice(0, 2), 16) * alpha + parseInt(bg.slice(0, 2), 16) * (1 - alpha),
  );
  const g = Math.round(
    parseInt(fg.slice(2, 4), 16) * alpha + parseInt(bg.slice(2, 4), 16) * (1 - alpha),
  );
  const b = Math.round(
    parseInt(fg.slice(4, 6), 16) * alpha + parseInt(bg.slice(4, 6), 16) * (1 - alpha),
  );
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

describe("WCAG AA color contrast verification (M3-17 / #38)", () => {
  const lightPaper = "#f6f7f5";
  const lightInk = "#141a17";
  const lightMuted = "#525a56";

  const darkPaper = "#0f1512";
  const darkInk = "#e8ede9";
  const darkMuted = "#949f99";

  it("light mode: primary ink clears AA body text (>= 4.5:1)", () => {
    const ratio = contrastRatio(lightInk, lightPaper);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(16);
  });

  it("light mode: semantic muted token clears AA body text (>= 4.5:1)", () => {
    const ratio = contrastRatio(lightMuted, lightPaper);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(6.5);
  });

  it("dark mode: primary ink clears AA body text (>= 4.5:1)", () => {
    const ratio = contrastRatio(darkInk, darkPaper);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(15);
  });

  it("dark mode: semantic muted token clears AA body text (>= 4.5:1)", () => {
    const ratio = contrastRatio(darkMuted, darkPaper);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(6.7);
  });

  it("demonstrates why raw ink opacities fail or are dangerously fragile on light paper", () => {
    const ink50Equivalent = composite(lightInk, lightPaper, 0.5);
    const ratio50 = contrastRatio(ink50Equivalent, lightPaper);
    // 3.30:1 fails WCAG AA minimum 4.5:1
    expect(ratio50).toBeLessThan(4.5);

    const ink60Equivalent = composite(lightInk, lightPaper, 0.6);
    const ratio60 = contrastRatio(ink60Equivalent, lightPaper);
    // 4.54:1 barely clears 4.5:1 by 0.04
    expect(ratio60).toBeGreaterThanOrEqual(4.5);
    expect(ratio60).toBeLessThan(4.6);
  });
});

describe("no forbidden low-contrast opacity classes (text-ink/50, text-ink/60)", () => {
  const scannedDirs = ["app", "components"];
  const FORBIDDEN_PATTERN = /text-ink\/(50|60)\b/;

  function getFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) return getFiles(fullPath);
      if (
        /\.(tsx?)$/.test(fullPath) &&
        !fullPath.endsWith(".test.ts") &&
        !fullPath.endsWith(".test.tsx")
      ) {
        return [fullPath];
      }
      return [];
    });
  }

  const allFiles = scannedDirs.flatMap(getFiles);

  it("finds source files across app/ and components/", () => {
    expect(allFiles.length).toBeGreaterThan(5);
  });

  it.each(allFiles)("%s has no text-ink/50 or text-ink/60", (file) => {
    const content = readFileSync(file, "utf8");
    const matches = content.match(FORBIDDEN_PATTERN);
    expect(matches).toBeNull();
  });

  it("detects forbidden opacities if re-introduced", () => {
    expect(FORBIDDEN_PATTERN.test('className="text-sm text-ink/50"')).toBe(true);
    expect(FORBIDDEN_PATTERN.test('className="text-sm text-ink/60"')).toBe(true);
    expect(FORBIDDEN_PATTERN.test('className="text-sm text-ink/70"')).toBe(false);
    expect(FORBIDDEN_PATTERN.test('className="text-sm text-muted"')).toBe(false);
  });

  it("ensures globals.css defines semantic muted tokens and @theme binding", () => {
    const globalsCss = readFileSync("app/globals.css", "utf8");
    expect(globalsCss).toContain("--color-muted: var(--muted);");
    expect(globalsCss).toContain("--muted: #525a56;");
    expect(globalsCss).toContain("--muted: #949f99;");
  });
});
