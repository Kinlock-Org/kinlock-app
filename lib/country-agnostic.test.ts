import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Country-agnostic core (AGENTS.md hard rule 11, roadmap M3-24): "Don't assume Nigeria, naira, or
 * any single market in code, tests, fixtures, copy, or examples." Country and currency are
 * registry data; nothing here may name one market by hand. Catches a regression of the exact
 * historical pattern this project moved away from (PRD.md's v0.3 changelog: "no longer
 * 'abroad to Nigeria'"), not a general ban on every country/currency word, since the fixtures and
 * UI deliberately exercise several real markets side by side.
 */
const BANNED = [/\bnigeria\b/i, /\bnaira\b/i, /\bngn\b/i, /\blagos\b/i];

/** Source roots this guard actually owns; excludes docs (PRD.md/ARCHITECTURE.md legitimately
 *  narrate the pre-v0.3 Nigeria-specific history) and generated/vendor output. */
const roots = ["app", "components", "lib", "messages"];
const EXCLUDED_SUFFIXES = [".test.ts", ".test.tsx"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    if (!/\.(tsx?|json)$/.test(path)) return [];
    if (EXCLUDED_SUFFIXES.some((suffix) => path.endsWith(suffix))) return [];
    return [path];
  });
}

const findings = (source: string): string[] =>
  BANNED.filter((pattern) => pattern.test(source)).map((pattern) => pattern.source);

describe("country-agnostic core: no hard-coded single-market terms", () => {
  const files = roots.flatMap(sourceFiles);

  it("scans the app's source", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(files)("%s", (file) => {
    expect(findings(readFileSync(file, "utf8"))).toEqual([]);
  });

  it("would catch a hard-coded market assumption", () => {
    expect(findings("const defaultCountry = 'Nigeria';")).toContain("\\bnigeria\\b");
    expect(findings('label: "Pay in naira"')).toContain("\\bnaira\\b");
    expect(findings('const code = "NGN";')).toContain("\\bngn\\b");
    expect(findings("country.displayName")).toEqual([]);
  });
});
