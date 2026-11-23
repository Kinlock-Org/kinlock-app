/**
 * Client-side CSV export for payee lock history. Roadmap X-05 (PAY-6).
 * Formats locks into RFC-4180 compliant CSV and triggers browser download.
 */
import { fromBaseUnits } from "@/lib/sdk";

export interface LockSummary {
  id: string;
  sender: string;
  total: string;
  released: string;
  expiresAt: string;
  state: string;
  createdAt: string;
}

export const CSV_HEADERS = [
  "lock_id",
  "sender_address",
  "total_usdc",
  "released_usdc",
  "unlock_date",
  "status",
  "created_at",
] as const;

/**
 * Escapes a single CSV cell value according to RFC 4180 rules:
 * Wraps values containing quotes, commas, or line breaks in double quotes,
 * and escapes double quotes by doubling them.
 */
export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Formats date strings to guaranteed ISO 8601 UTC representation. */
export function toISOUtcDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return dateStr;
  }
  return d.toISOString();
}

/** Formats BigInt base units into human-readable decimal strings via SDK. */
export function formatBaseUnitsSafe(baseUnitsStr: string): string {
  try {
    return fromBaseUnits(BigInt(baseUnitsStr));
  } catch {
    return baseUnitsStr;
  }
}

/**
 * Formats an array of locks into a CSV string with standard header row.
 * Amounts are converted from base units via SDK helper, and dates are in ISO 8601 UTC.
 */
export function formatLocksToCSV(locks: LockSummary[]): string {
  const headerLine = CSV_HEADERS.join(",");
  if (locks.length === 0) {
    return `${headerLine}\r\n`;
  }

  const rows = locks.map((lock) => {
    return [
      escapeCSVCell(lock.id),
      escapeCSVCell(lock.sender),
      escapeCSVCell(formatBaseUnitsSafe(lock.total)),
      escapeCSVCell(formatBaseUnitsSafe(lock.released)),
      escapeCSVCell(toISOUtcDate(lock.expiresAt)),
      escapeCSVCell(lock.state),
      escapeCSVCell(toISOUtcDate(lock.createdAt)),
    ].join(",");
  });

  return `${headerLine}\r\n${rows.join("\r\n")}\r\n`;
}

/** Triggers a browser file download using Blob URL. Safe when running outside browser. */
export function downloadCSV(filename: string, csvContent: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
