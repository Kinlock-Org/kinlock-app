/**
 * CSV export for payee lock history. Roadmap row X-05 (PAY-6).
 * Fulfills institutional reconciliation requirements.
 */

import { fromBaseUnits } from "@/lib/sdk";

export interface LockSummary {
  lock_id?: string | number | bigint;
  id?: string | number | bigint;

  sender_address?: string;
  sender?: string;

  total_usdc?: string | bigint | number;
  total?: string | bigint | number;

  released_usdc?: string | bigint | number;
  released?: string | bigint | number;

  unlock_date?: string | Date | number | null;
  unlockDate?: string | Date | number | null;
  expires_at?: string | Date | number | null;
  expiresAt?: string | Date | number | null;

  status?: string;
  state?: string;

  created_at?: string | Date | number | null;
  createdAt?: string | Date | number | null;

  [key: string]: unknown;
}

export const CSV_COLUMNS = [
  "lock_id",
  "sender_address",
  "total_usdc",
  "released_usdc",
  "unlock_date",
  "status",
  "created_at",
] as const;

export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export function formatAmount(value: unknown): string {
  if (value === null || value === undefined) return "0";
  if (typeof value === "bigint") {
    return fromBaseUnits(value);
  }
  if (typeof value === "number") {
    return fromBaseUnits(BigInt(Math.trunc(value)));
  }
  const s = String(value).trim();
  if (!s) return "0";
  if (s.includes(".")) {
    return s;
  }
  try {
    return fromBaseUnits(BigInt(s));
  } catch {
    return s;
  }
}

export function formatDate(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const d = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString();
}

/**
 * Formats a list of locks into an RFC-4180 compliant CSV string.
 * Columns: lock_id,sender_address,total_usdc,released_usdc,unlock_date,status,created_at
 */
export function formatLocksToCSV(locks: LockSummary[], eol = "\r\n"): string {
  const header = CSV_COLUMNS.join(",");
  const rows = locks.map((lock) => {
    const lockId = lock.lock_id ?? lock.id ?? "";
    const sender = lock.sender_address ?? lock.sender ?? "";
    const total = formatAmount(lock.total_usdc ?? lock.total);
    const released = formatAmount(lock.released_usdc ?? lock.released);

    const rawUnlock =
      lock.unlock_date !== undefined
        ? lock.unlock_date
        : lock.unlockDate !== undefined
          ? lock.unlockDate
          : (lock.expiresAt ?? lock.expires_at ?? "");
    const unlockDate = formatDate(rawUnlock);

    const status = lock.status ?? lock.state ?? "";
    const createdAt = formatDate(lock.created_at ?? lock.createdAt);

    return [
      escapeCSVCell(lockId),
      escapeCSVCell(sender),
      escapeCSVCell(total),
      escapeCSVCell(released),
      escapeCSVCell(unlockDate),
      escapeCSVCell(status),
      escapeCSVCell(createdAt),
    ].join(",");
  });

  return [header, ...rows].join(eol);
}

/**
 * Triggers a client-side browser download of the CSV content.
 */
export function downloadCSV(csvContent: string, filename?: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  const name = filename || `kinlock-payee-locks-${dateStr}.csv`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", name);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
