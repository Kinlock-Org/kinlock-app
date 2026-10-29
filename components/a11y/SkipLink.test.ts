import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";

describe("accessible navigation and skip-to-content link (M3-17 / #39)", () => {
  const layoutSource = readFileSync("app/layout.tsx", "utf8");
  const skipLinkSource = readFileSync("components/a11y/SkipLink.tsx", "utf8");
  const siteHeaderSource = readFileSync("components/nav/SiteHeader.tsx", "utf8");
  const globalsCssSource = readFileSync("app/globals.css", "utf8");

  it("registers skipToContent in common messages", () => {
    expect(en.common).toHaveProperty("skipToContent");
    expect(en.common.skipToContent).toBe("Skip to main content");
  });

  it("SkipLink component defaults to #main-content and has proper sr-only / focus styling", () => {
    expect(skipLinkSource).toMatch(/href=\{`#\$\{targetId\}`\}/);
    expect(skipLinkSource).toContain("sr-only");
    expect(skipLinkSource).toContain("focus:not-sr-only");
    expect(skipLinkSource).toContain('targetId = "main-content"');
    expect(skipLinkSource).toContain('t("common.skipToContent")');
  });

  it("app/layout.tsx renders SkipLink as the first tab stop before the testnet banner and SiteHeader", () => {
    const skipLinkPos = layoutSource.indexOf("<SkipLink");
    const bannerPos = layoutSource.indexOf("common.testnetBanner");
    const siteHeaderPos = layoutSource.indexOf("<SiteHeader");
    const mainPos = layoutSource.indexOf("<main");

    expect(skipLinkPos).toBeGreaterThan(-1);
    expect(bannerPos).toBeGreaterThan(-1);
    expect(siteHeaderPos).toBeGreaterThan(-1);
    expect(mainPos).toBeGreaterThan(-1);

    // SkipLink must come before the testnet banner
    expect(skipLinkPos).toBeLessThan(bannerPos);
    // SkipLink must come before the SiteHeader
    expect(skipLinkPos).toBeLessThan(siteHeaderPos);
    // SkipLink must precede main content
    expect(skipLinkPos).toBeLessThan(mainPos);
  });

  it("app/layout.tsx wraps children in a semantic main landmark with id='main-content' and tabIndex={-1}", () => {
    expect(layoutSource).toMatch(/<main[^>]*id=["']main-content["']/);
    expect(layoutSource).toMatch(/<main[^>]*tabIndex=\{-1\}/);
  });

  it("SiteHeader closes disclosure menu on Escape and restores focus to toggle button", () => {
    expect(siteHeaderSource).toContain('e.key === "Escape"');
    expect(siteHeaderSource).toContain("toggleRef.current?.focus()");
    expect(siteHeaderSource).toContain("ref={toggleRef}");
    expect(siteHeaderSource).toContain("aria-expanded={open}");
    expect(siteHeaderSource).toContain("aria-controls={menuId}");
  });

  it("SiteHeader interactive elements have explicit focus-visible classes", () => {
    expect(siteHeaderSource).toContain("focus-visible:outline-accent");
    expect(siteHeaderSource).toContain("focus-visible:outline-2");
  });

  it("app/globals.css includes :focus-visible rules with WCAG 2.2 compliant outline", () => {
    expect(globalsCssSource).toContain(":focus-visible");
    expect(globalsCssSource).toContain("outline: 2px solid var(--accent);");
    expect(globalsCssSource).toContain("outline-offset: 2px;");
  });
});
