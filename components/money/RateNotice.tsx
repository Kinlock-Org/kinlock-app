import { t } from "@/lib/i18n/messages";

/** Rate-risk disclosure, or the USD-only note when no reliable rate exists. Roadmap M3-16. */
export function RateNotice({ hasRate }: { hasRate: boolean }) {
  return <p>{hasRate ? t("common.rateRiskNote") : t("common.usdOnlyNote")}</p>;
}
