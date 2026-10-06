import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every user-visible string lives in messages/<locale>.json (AGENTS.md §8.3, roadmap M3-23).
 * This fails if a page or component has letters in JSX text outside `{…}` expressions.
 */
const roots = ["app", "components"];
const tsxFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsxFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });

const inlineText = (source: string): string[] =>
  [...source.replace(/\{[^{}]*\}/g, "{}").matchAll(/>([^<>{}]*\p{L}[^<>{}]*)</gu)]
    .map((m) => (m[1] ?? "").trim())
    .filter(Boolean);

describe("no inline UI strings", () => {
  const files = roots.flatMap(tsxFiles);

  it("scans the app's components", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files)("%s", (file) => {
    expect(inlineText(readFileSync(file, "utf8"))).toEqual([]);
  });

  it("would catch a hard-coded string", () => {
    expect(inlineText("<p>Send money</p>")).toEqual(["Send money"]);
    expect(inlineText('<p>{t("pages.send.title")}</p>')).toEqual([]);
  });
});
