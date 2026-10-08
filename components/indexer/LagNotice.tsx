import { t } from "@/lib/i18n/messages";

/**
 * Shown on indexer-backed list pages when the data might be a little stale. Never a reason to
 * block anything: preflight's blocking checks and every claim/release/refund read chain state
 * directly regardless (hard rule 3). Roadmap M3-21.
 */
export function LagNotice({ lagging }: { lagging: boolean }) {
  if (!lagging) return null;
  return (
    <p role="status" className="mt-2 text-sm text-ink/60">
      {t("common.indexerLagNotice")}
    </p>
  );
}
