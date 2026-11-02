import { describe, expect, it, vi } from "vitest";
import * as csvModule from "@/lib/csv";
import { t } from "@/lib/i18n/messages";
import { ExportCSVButton } from "./ExportCSVButton";

describe("ExportCSVButton component", () => {
  it("renders a button element with externalized export label", () => {
    const element = ExportCSVButton({
      locks: [
        {
          id: "1",
          sender: "GBBM6WDFDWINJB4GO6GCT6EVK375WZWW4NPWBFFEBAMZTXFOWA3KITSK",
          total: "10000000",
          released: "0",
          state: "Open",
          expiresAt: "2026-12-31T00:00:00.000Z",
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      ],
    });

    expect(element.type).toBe("button");
    expect(element.props.type).toBe("button");
    expect(element.props.children).toBe(t("pages.payee.exportCsv"));
    expect(element.props["aria-label"]).toBe(t("pages.payee.exportCsv"));
    expect(element.props.disabled).toBe(false);
  });

  it("is disabled when locks array is empty", () => {
    const element = ExportCSVButton({
      locks: [],
    });

    expect(element.props.disabled).toBe(true);
  });

  it("is disabled when disabled prop is explicitly true even with locks", () => {
    const element = ExportCSVButton({
      locks: [
        {
          id: "1",
          sender: "GABC",
          total: "10000000",
          released: "0",
          state: "Open",
          expiresAt: "2026-12-31T00:00:00.000Z",
          createdAt: "2026-10-01T00:00:00.000Z",
        },
      ],
      disabled: true,
    });

    expect(element.props.disabled).toBe(true);
  });

  it("triggers CSV formatting and download on click", () => {
    const formatLocksSpy = vi.spyOn(csvModule, "formatLocksToCSV");
    const downloadCSVSpy = vi.spyOn(csvModule, "downloadCSV").mockImplementation(() => {});

    const mockLocks = [
      {
        id: "5",
        sender: "GSENDER",
        total: 50_000_000n,
        released: 10_000_000n,
        unlockDate: "2026-11-15T00:00:00.000Z",
        status: "Open",
        createdAt: "2026-10-15T00:00:00.000Z",
      },
    ];

    const element = ExportCSVButton({
      locks: mockLocks,
      filename: "custom-export.csv",
    });

    element.props.onClick();

    expect(formatLocksSpy).toHaveBeenCalledWith(mockLocks);
    expect(downloadCSVSpy).toHaveBeenCalledWith(expect.any(String), "custom-export.csv");

    formatLocksSpy.mockRestore();
    downloadCSVSpy.mockRestore();
  });
});
