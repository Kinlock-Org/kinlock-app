import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const AUDITED_FILES = [
  "app/send/SendForm.tsx",
  "app/claim/[id]/ClaimView.tsx",
  "app/request/RequestForm.tsx",
  "components/claim-links/SavedClaimLinks.tsx",
  "components/nav/SiteHeader.tsx",
];

function extractTagBlocks(source: string, openPrefix: string, closeSuffix: string): string[] {
  const parts = source.split(openPrefix).slice(1);
  return parts.map((part) => {
    const endIdx = part.indexOf(closeSuffix);
    return endIdx === -1 ? part : part.slice(0, endIdx);
  });
}

describe("mobile viewport audit and touch target minimum sizing (#77)", () => {
  for (const relPath of AUDITED_FILES) {
    it(`enforces 44x44px minimum touch targets on buttons in ${relPath}`, () => {
      const fullPath = resolve(process.cwd(), relPath);
      const source = readFileSync(fullPath, "utf8");
      const buttons = extractTagBlocks(source, "<button", "</button>");
      expect(buttons.length).toBeGreaterThan(0);
      for (const buttonBlock of buttons) {
        expect(buttonBlock).toContain("min-h-[44px]");
        expect(buttonBlock).toContain("min-w-[44px]");
      }
    });
  }

  for (const relPath of ["app/send/SendForm.tsx", "app/request/RequestForm.tsx"]) {
    it(`enforces 44px minimum height on select and text/date/decimal inputs in ${relPath}`, () => {
      const fullPath = resolve(process.cwd(), relPath);
      const source = readFileSync(fullPath, "utf8");
      const selects = extractTagBlocks(source, "<select", "</select>");
      expect(selects.length).toBeGreaterThan(0);
      for (const selectBlock of selects) {
        expect(selectBlock).toContain("min-h-[44px]");
      }

      const inputs = extractTagBlocks(source, "<input", "/>");
      expect(inputs.length).toBeGreaterThan(0);
      for (const inputBlock of inputs) {
        if (inputBlock.includes('type="radio"') || inputBlock.includes('type="checkbox"')) {
          continue;
        }
        expect(inputBlock).toContain("min-h-[44px]");
      }
    });
  }
});
