import { describe, expect, it, vi } from "vitest";
import {
  CSV_COLUMNS,
  downloadCSV,
  escapeCSVCell,
  formatAmount,
  formatDate,
  formatLocksToCSV,
  type LockSummary,
} from "./csv";

describe("lib/csv", () => {
  describe("CSV_COLUMNS", () => {
    it("defines the 7 required columns in exact order", () => {
      expect(CSV_COLUMNS).toEqual([
        "lock_id",
        "sender_address",
        "total_usdc",
        "released_usdc",
        "unlock_date",
        "status",
        "created_at",
      ]);
    });
  });

  describe("escapeCSVCell", () => {
    it("returns empty string for null and undefined", () => {
      expect(escapeCSVCell(null)).toBe("");
      expect(escapeCSVCell(undefined)).toBe("");
    });

    it("returns plain strings unmodified if no special characters are present", () => {
      expect(escapeCSVCell("hello")).toBe("hello");
      expect(escapeCSVCell("123")).toBe("123");
      expect(escapeCSVCell("Open")).toBe("Open");
    });

    it("wraps cells containing commas in double quotes", () => {
      expect(escapeCSVCell("Springfield, Elementary")).toBe('"Springfield, Elementary"');
    });

    it("wraps cells containing double quotes and escapes them with double quotes", () => {
      expect(escapeCSVCell('School "Alpha"')).toBe('"School ""Alpha"""');
      expect(escapeCSVCell('quote"inside')).toBe('"quote""inside"');
    });

    it("wraps cells containing newlines or carriage returns", () => {
      expect(escapeCSVCell("line1\nline2")).toBe('"line1\nline2"');
      expect(escapeCSVCell("line1\r\nline2")).toBe('"line1\r\nline2"');
    });
  });

  describe("formatAmount", () => {
    it("formats BigInt base units using 7 decimals (SDK helper)", () => {
      expect(formatAmount(10_000_000n)).toBe("1");
      expect(formatAmount(15_500_000n)).toBe("1.55");
      expect(formatAmount(100n)).toBe("0.00001");
      expect(formatAmount(0n)).toBe("0");
    });

    it("formats base unit integer strings as decimals", () => {
      expect(formatAmount("10000000")).toBe("1");
      expect(formatAmount("500000000")).toBe("50");
      expect(formatAmount("0")).toBe("0");
    });

    it("preserves pre-formatted decimal strings", () => {
      expect(formatAmount("150.25")).toBe("150.25");
      expect(formatAmount("0.05")).toBe("0.05");
    });

    it("handles null or undefined by returning '0'", () => {
      expect(formatAmount(null)).toBe("0");
      expect(formatAmount(undefined)).toBe("0");
      expect(formatAmount("")).toBe("0");
    });
  });

  describe("formatDate", () => {
    it("returns ISO 8601 UTC string for Date objects", () => {
      const d = new Date("2026-11-01T15:30:00.000Z");
      expect(formatDate(d)).toBe("2026-11-01T15:30:00.000Z");
    });

    it("returns ISO 8601 UTC string for parseable string dates", () => {
      expect(formatDate("2026-10-15T08:00:00Z")).toBe("2026-10-15T08:00:00.000Z");
    });

    it("returns empty string for null, undefined, or empty values", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
      expect(formatDate("")).toBe("");
    });
  });

  describe("formatLocksToCSV", () => {
    it("generates header-only CSV when lock list is empty", () => {
      const csv = formatLocksToCSV([]);
      expect(csv).toBe(
        "lock_id,sender_address,total_usdc,released_usdc,unlock_date,status,created_at",
      );
    });

    it("formats locks using explicit LockSummary fields", () => {
      const locks: LockSummary[] = [
        {
          lock_id: "42",
          sender_address: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
          total_usdc: 100_000_000n,
          released_usdc: 25_000_000n,
          unlock_date: "2026-12-01T00:00:00.000Z",
          status: "Open",
          created_at: "2026-11-01T12:00:00.000Z",
        },
      ];

      const csv = formatLocksToCSV(locks, "\n");
      const lines = csv.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe(
        "lock_id,sender_address,total_usdc,released_usdc,unlock_date,status,created_at",
      );
      expect(lines[1]).toBe(
        "42,GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ,10,2.5,2026-12-01T00:00:00.000Z,Open,2026-11-01T12:00:00.000Z",
      );
    });

    it("formats IndexedLock compatible objects with base unit strings and state", () => {
      const indexedLocks: LockSummary[] = [
        {
          id: "101",
          sender: "GBBM6WDFDWINJB4GO6GCT6EVK375WZWW4NPWBFFEBAMZTXFOWA3KITSK",
          total: "50000000",
          released: "0",
          state: "Open",
          expiresAt: "2026-12-31T23:59:59.000Z",
          createdAt: "2026-10-20T10:00:00.000Z",
        },
      ];

      const csv = formatLocksToCSV(indexedLocks, "\n");
      const lines = csv.split("\n");
      expect(lines[1]).toBe(
        "101,GBBM6WDFDWINJB4GO6GCT6EVK375WZWW4NPWBFFEBAMZTXFOWA3KITSK,5,0,2026-12-31T23:59:59.000Z,Open,2026-10-20T10:00:00.000Z",
      );
    });

    it("properly escapes fields with commas and double quotes", () => {
      const locks: LockSummary[] = [
        {
          lock_id: 'ID,"Special"',
          sender_address: "Address, with comma",
          total_usdc: "100.00",
          released_usdc: "0.00",
          unlock_date: "2026-11-10T00:00:00.000Z",
          status: 'Status "Pending"',
          created_at: "2026-11-01T00:00:00.000Z",
        },
      ];

      const csv = formatLocksToCSV(locks, "\n");
      const lines = csv.split("\n");
      expect(lines[1]).toBe(
        '"ID,""Special"""' +
          "," +
          '"Address, with comma"' +
          ",100.00,0.00,2026-11-10T00:00:00.000Z," +
          '"Status ""Pending"""' +
          ",2026-11-01T00:00:00.000Z",
      );
    });

    it("handles multiple locks and maintains correct column order", () => {
      const locks: LockSummary[] = [
        {
          id: "1",
          sender: "SENDER1",
          total: 10_000_000n,
          released: 10_000_000n,
          unlockDate: "2026-11-01T00:00:00Z",
          status: "Completed",
          createdAt: "2026-10-01T00:00:00Z",
        },
        {
          id: "2",
          sender: "SENDER2",
          total: 20_000_000n,
          released: 0n,
          unlockDate: "2026-11-02T00:00:00Z",
          status: "Declined",
          createdAt: "2026-10-02T00:00:00Z",
        },
      ];

      const csv = formatLocksToCSV(locks);
      expect(csv).toContain("\r\n");
      const lines = csv.split("\r\n");
      expect(lines).toHaveLength(3);
      const line1 = lines[1] ?? "";
      const line2 = lines[2] ?? "";
      expect(line1.split(",")[0]).toBe("1");
      expect(line1.split(",")[5]).toBe("Completed");
      expect(line2.split(",")[0]).toBe("2");
      expect(line2.split(",")[5]).toBe("Declined");
    });
  });

  describe("downloadCSV", () => {
    it("safely no-ops in non-browser environment", () => {
      expect(() => downloadCSV("test")).not.toThrow();
    });

    it("creates an object URL, clicks anchor, and revokes URL in DOM environment", () => {
      const fakeUrl = "blob:https://kinlock.app/fake-uuid";
      const createObjectURLMock = vi.fn().mockReturnValue(fakeUrl);
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      const mockElement = {
        setAttribute: vi.fn(),
        style: {},
        click: clickMock,
      };

      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();
      const createElementMock = vi.fn().mockReturnValue(mockElement);

      const fakeDoc = {
        body: {
          appendChild: appendChildMock,
          removeChild: removeChildMock,
        },
        createElement: createElementMock,
      };

      // Temporarily attach window and document to globalThis
      const originalWindow = globalThis.window;
      const originalDocument = globalThis.document;
      // @ts-expect-error test mock
      globalThis.window = {};
      // @ts-expect-error test mock
      globalThis.document = fakeDoc;

      try {
        downloadCSV("lock_id,sender_address\n1,GABC", "test-locks.csv");

        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
        expect(createElementMock).toHaveBeenCalledWith("a");
        expect(mockElement.setAttribute).toHaveBeenCalledWith("href", fakeUrl);
        expect(mockElement.setAttribute).toHaveBeenCalledWith("download", "test-locks.csv");
        expect(appendChildMock).toHaveBeenCalledWith(mockElement);
        expect(clickMock).toHaveBeenCalledTimes(1);
        expect(removeChildMock).toHaveBeenCalledWith(mockElement);
        expect(revokeObjectURLMock).toHaveBeenCalledWith(fakeUrl);
      } finally {
        globalThis.window = originalWindow;
        globalThis.document = originalDocument;
      }
    });
  });
});
