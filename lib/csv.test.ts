import { describe, expect, it, vi } from "vitest";
import {
  CSV_HEADERS,
  downloadCSV,
  escapeCSVCell,
  formatBaseUnitsSafe,
  formatLocksToCSV,
  type LockSummary,
  toISOUtcDate,
} from "./csv";

describe("lib/csv", () => {
  describe("escapeCSVCell", () => {
    it("returns plain strings unchanged", () => {
      expect(escapeCSVCell("hello")).toBe("hello");
      expect(escapeCSVCell("12345")).toBe("12345");
    });

    it("escapes strings with commas in double quotes", () => {
      expect(escapeCSVCell("hello,world")).toBe('"hello,world"');
    });

    it("escapes quotes by doubling them and wrapping in quotes", () => {
      expect(escapeCSVCell('hello "world"')).toBe('"hello ""world"""');
    });

    it("escapes line breaks in quotes", () => {
      expect(escapeCSVCell("line1\nline2")).toBe('"line1\nline2"');
      expect(escapeCSVCell("line1\r\nline2")).toBe('"line1\r\nline2"');
    });

    it("handles null and undefined safely", () => {
      expect(escapeCSVCell(null)).toBe("");
      expect(escapeCSVCell(undefined)).toBe("");
    });
  });

  describe("toISOUtcDate", () => {
    it("formats standard timestamps to ISO 8601 UTC strings", () => {
      const formatted = toISOUtcDate("2026-11-23T11:00:00+08:00");
      expect(formatted).toBe("2026-11-23T03:00:00.000Z");
    });

    it("returns original string when date parsing fails", () => {
      expect(toISOUtcDate("not-a-valid-date")).toBe("not-a-valid-date");
    });
  });

  describe("formatBaseUnitsSafe", () => {
    it("converts 7-decimal base units to human readable decimals", () => {
      expect(formatBaseUnitsSafe("10000000")).toBe("1");
      expect(formatBaseUnitsSafe("25000000")).toBe("2.5");
      expect(formatBaseUnitsSafe("0")).toBe("0");
    });

    it("falls back to original string on parsing error", () => {
      expect(formatBaseUnitsSafe("invalid_amount")).toBe("invalid_amount");
    });
  });

  describe("formatLocksToCSV", () => {
    it("generates correct header row when lock list is empty", () => {
      const csv = formatLocksToCSV([]);
      expect(csv).toBe(
        "lock_id,sender_address,total_usdc,released_usdc,unlock_date,status,created_at\r\n",
      );
    });

    it("formats locks with correct headers, column ordering, and values", () => {
      const mockLocks: LockSummary[] = [
        {
          id: "1",
          sender: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
          total: "100000000",
          released: "50000000",
          expiresAt: "2026-12-01T00:00:00Z",
          state: "Open",
          createdAt: "2026-11-01T12:00:00Z",
        },
        {
          id: "2",
          sender: 'GCLMHF,"Escrow",Dept',
          total: "20000000",
          released: "0",
          expiresAt: "2026-12-15T00:00:00Z",
          state: "Completed",
          createdAt: "2026-11-10T08:00:00Z",
        },
      ];

      const csv = formatLocksToCSV(mockLocks);
      const lines = csv.split("\r\n").filter((l) => l.length > 0);

      expect(lines[0]).toBe(CSV_HEADERS.join(","));
      expect(lines).toHaveLength(3);

      expect(lines[1]).toBe(
        "1,GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5,10,5,2026-12-01T00:00:00.000Z,Open,2026-11-01T12:00:00.000Z",
      );

      // Verify row with comma in sender address is properly escaped
      expect(lines[2]).toBe(
        '2,"GCLMHF,""Escrow"",Dept",2,0,2026-12-15T00:00:00.000Z,Completed,2026-11-10T08:00:00.000Z',
      );
    });
  });

  describe("downloadCSV", () => {
    it("safely does nothing in non-browser environment", () => {
      expect(() => downloadCSV("test.csv", "a,b")).not.toThrow();
    });

    it("triggers file download via blob and link click when browser globals are present", () => {
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockSetAttribute = vi.fn();

      const mockAnchor = {
        setAttribute: mockSetAttribute,
        style: {},
        click: mockClick,
      };

      const mockDoc = {
        createElement: vi.fn().mockReturnValue(mockAnchor),
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild,
        },
      };

      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
      const mockRevokeObjectURL = vi.fn();

      const originalWindow = globalThis.window;
      const originalDocument = globalThis.document;
      const originalURL = globalThis.URL;

      try {
        (globalThis as unknown as { window: unknown }).window = {};
        (globalThis as unknown as { document: unknown }).document = mockDoc;
        (globalThis as unknown as { URL: unknown }).URL = {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL,
        };

        downloadCSV("locks.csv", "lock_id\r\n1\r\n");

        expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
        expect(mockDoc.createElement).toHaveBeenCalledWith("a");
        expect(mockSetAttribute).toHaveBeenCalledWith("href", "blob:test-url");
        expect(mockSetAttribute).toHaveBeenCalledWith("download", "locks.csv");
        expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
        expect(mockClick).toHaveBeenCalledTimes(1);
        expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
        expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
      } finally {
        (globalThis as unknown as { window: unknown }).window = originalWindow;
        (globalThis as unknown as { document: unknown }).document = originalDocument;
        (globalThis as unknown as { URL: unknown }).URL = originalURL;
      }
    });
  });
});
