"use client";

import { downloadCSV, formatLocksToCSV, type LockSummary } from "@/lib/csv";
import { t } from "@/lib/i18n/messages";

export interface ExportCSVButtonProps {
  locks: LockSummary[];
  filename?: string;
  className?: string;
}

/**
 * Client-side button to export payee lock history into CSV.
 * Fulfills roadmap row X-05 (PAY-6).
 */
export function ExportCSVButton({ locks, filename, className }: ExportCSVButtonProps) {
  function handleExport() {
    if (locks.length === 0) return;
    const csv = formatLocksToCSV(locks);
    const targetName = filename || `payee-locks-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(targetName, csv);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={locks.length === 0}
      className={
        className ||
        "self-start rounded border px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
      }
      aria-label={t("pages.payee.exportCsvAria")}
    >
      {t("pages.payee.exportCsv")}
    </button>
  );
}
