import { formatDateTimeUtcAndLocal } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/messages";

/** A ledger timestamp shown in UTC and in the viewer's local time. Roadmap M3-15. */
export function DateTimeDisplay({ unixSeconds, locale }: { unixSeconds: bigint; locale: string }) {
  const { utc, local } = formatDateTimeUtcAndLocal(unixSeconds, locale);
  const iso = new Date(Number(unixSeconds) * 1000).toISOString();
  return (
    <time dateTime={iso} className="datetime">
      <span>
        {t("time.local")}: {local}
      </span>{" "}
      <span>
        {t("time.utc")}: {utc}
      </span>
    </time>
  );
}
