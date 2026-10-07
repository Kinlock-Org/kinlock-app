"use client";

import { t } from "@/lib/i18n/messages";
import { useSavedClaimLinks } from "./useSavedClaimLinks";

/** The sender's claim links, from this browser's storage only. Roadmap M3-07. */
export function SavedClaimLinks() {
  const s = useSavedClaimLinks();
  return (
    <section aria-labelledby="saved-claim-links" className="mt-8 flex flex-col gap-3">
      <h2 id="saved-claim-links" className="text-xl font-semibold">
        {t("claimLinks.heading")}
      </h2>
      <p className="text-sm">{t("claimLinks.intro")}</p>
      {s.available ? null : <p role="alert">{t("claimLinks.unavailable")}</p>}
      {s.available && s.links.length === 0 ? <p>{t("claimLinks.empty")}</p> : null}
      <ul className="flex flex-col gap-2">
        {s.links.map((link) => (
          <li key={link.lockId} className="flex flex-col gap-1 rounded border p-3">
            <span className="font-medium">
              {t("claimLinks.lock")} {link.lockId}
            </span>
            <span className="text-sm">
              {t("claimLinks.savedAt")}:{" "}
              <time dateTime={link.savedAt}>
                {link.savedAt.replace("T", " ").slice(0, 16)} {t("time.utc")}
              </time>
            </span>
            <span className="flex gap-3">
              <button type="button" onClick={() => s.copy(link)} className="underline">
                {s.copiedLockId === link.lockId ? t("claimLinks.copied") : t("claimLinks.copy")}
              </button>
              <button type="button" onClick={() => s.remove(link.lockId)} className="underline">
                {t("claimLinks.remove")}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {s.links.length > 0 ? (
        <button type="button" onClick={s.exportAll} className="self-start rounded border px-4 py-2">
          {t("claimLinks.export")}
        </button>
      ) : null}
    </section>
  );
}
