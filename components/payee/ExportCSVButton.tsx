"use client";

import { downloadCSV, formatLocksToCSV, type LockSummary } from "@/lib/csv";
import { t } from "@/lib/i18n/messages";

export interface ExportCSVButtonProps {
  locks: LockSummary[];
  disabled?: boolean;
  filename?: string;
  className?: string;
}

/**
 * Client-side CSV export button for payee lock history (Roadmap X-05 / PAY-6).
 * Enables institutional payees (schools, landlords) to export locks for reconciliation.
 */
export function ExportCSVButton({
  locks,
  disabled = false,
  filename,
  className = "self-start rounded border px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50",
}: ExportCSVButtonProps) {
  function handleExport() {
    const csv = formatLocksToCSV(locks);
    downloadCSV(csv, filename);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || locks.length === 0}
      className={className}
      aria-label={t("pages.payee.exportCsv")}
    >
      {t("pages.payee.exportCsv")}
    </button>
  );
}
