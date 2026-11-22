import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Asset labeling, enforced (AGENTS.md §8.3, hard rule 7, roadmap M3-15): every amount shows its
 * code AND its issuer, and the code is never assumed in source — it comes from
 * `NEXT_PUBLIC_USDC_ASSET_CODE` through `configuredAsset()`, which returns code, issuer and token
 * contract as one value so a label can never pair an assumed code with a different token.
 */

/** Where the label is assembled: the validated schema and the single projection. */
const OWNERS = [join("lib", "config.ts"), join("lib", "sdk.ts")];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(path) && !path.endsWith(".test.ts") ? [path] : [];
  });
}

const codeFiles = ["app", "components", "lib"]
  .flatMap(sourceFiles)
  .filter((f) => !OWNERS.includes(f));

/** `<AmountDisplay>` tags missing either half of the label. */
const unlabeledAmounts = (source: string): string[] =>
  [...source.matchAll(/<AmountDisplay\b[\s\S]*?\/>/g)]
    .map((m) => m[0] ?? "")
    .filter((tag) => !/assetCode=\{/.test(tag) || !/issuer=\{/.test(tag));

/** A quoted asset code in source: the UI would print a code nobody configured. */
const assumedCodes = (source: string): string[] => source.match(/["'`]USDC["'`]/g) ?? [];

/** Reading the asset's config outside `configuredAsset()`: half a label, silently. */
const directAssetConfigReads = (source: string): string[] =>
  source.match(/NEXT_PUBLIC_USDC_(ASSET_CODE|ISSUER|CONTRACT_ID)/g) ?? [];

describe("asset code and issuer are always shown and never assumed", () => {
  it("scans the app's source", () => {
    expect(codeFiles.length).toBeGreaterThan(10);
  });

  it.each(codeFiles)("%s shows both halves of every amount", (file) => {
    expect(unlabeledAmounts(readFileSync(file, "utf8"))).toEqual([]);
  });

  it.each(codeFiles)("%s names no asset code in source", (file) => {
    expect(assumedCodes(readFileSync(file, "utf8"))).toEqual([]);
  });

  it.each(codeFiles)("%s reads asset config only through configuredAsset()", (file) => {
    expect(directAssetConfigReads(readFileSync(file, "utf8"))).toEqual([]);
  });

  it("would catch an amount labelled by code alone", () => {
    expect(
      unlabeledAmounts('<AmountDisplay decimal={d} assetCode="USDC" locale={l} />'),
    ).toHaveLength(1);
    expect(
      unlabeledAmounts(
        "<AmountDisplay decimal={d} assetCode={a.code} issuer={a.issuer} locale={l} />",
      ),
    ).toEqual([]);
  });

  it("would catch a hard-coded code or a half-read asset config", () => {
    expect(assumedCodes('export const ASSET_CODE = "USDC";')).toEqual(['"USDC"']);
    expect(assumedCodes("const category = z.enum(['School', 'Rent']);")).toEqual([]);
    expect(directAssetConfigReads("issuer: publicConfig().NEXT_PUBLIC_USDC_ISSUER")).toEqual([
      "NEXT_PUBLIC_USDC_ISSUER",
    ]);
  });
});
