import { describe, expect, it, vi } from "vitest";
import * as csvLib from "@/lib/csv";
import { t } from "@/lib/i18n/messages";
import { ExportCSVButton } from "./ExportCSVButton";

describe("ExportCSVButton component", () => {
  it("renders a button with correct aria-label and label text", () => {
    const mockLocks: csvLib.LockSummary[] = [
      {
        id: "1",
        sender: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        total: "100000000",
        released: "50000000",
        expiresAt: "2026-12-01T00:00:00Z",
        state: "Open",
        createdAt: "2026-11-01T12:00:00Z",
      },
    ];

    const element = ExportCSVButton({ locks: mockLocks });
    expect(element.type).toBe("button");
    expect(element.props.type).toBe("button");
    expect(element.props.disabled).toBe(false);
    expect(element.props["aria-label"]).toBe(t("pages.payee.exportCsvAria"));
    expect(element.props.children).toBe(t("pages.payee.exportCsv"));
  });

  it("is disabled when locks list is empty", () => {
    const element = ExportCSVButton({ locks: [] });
    expect(element.type).toBe("button");
    expect(element.props.disabled).toBe(true);
  });

  it("triggers CSV formatting and download on click", () => {
    const mockLocks: csvLib.LockSummary[] = [
      {
        id: "10",
        sender: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        total: "50000000",
        released: "0",
        expiresAt: "2026-12-01T00:00:00Z",
        state: "Open",
        createdAt: "2026-11-01T12:00:00Z",
      },
    ];

    const formatSpy = vi.spyOn(csvLib, "formatLocksToCSV");
    const downloadSpy = vi.spyOn(csvLib, "downloadCSV").mockImplementation(() => {});

    const element = ExportCSVButton({
      locks: mockLocks,
      filename: "custom-export.csv",
    });

    // Invoke onClick handler
    element.props.onClick();

    expect(formatSpy).toHaveBeenCalledWith(mockLocks);
    expect(downloadSpy).toHaveBeenCalledWith(
      "custom-export.csv",
      expect.stringContaining("lock_id,sender_address"),
    );

    formatSpy.mockRestore();
    downloadSpy.mockRestore();
  });
});
