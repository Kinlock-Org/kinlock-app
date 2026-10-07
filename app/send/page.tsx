/** Sender flow: request-link prefill, preflight, USD + indicative local currency. Roadmap M3-06. */
import { SavedClaimLinks } from "@/components/claim-links/SavedClaimLinks";
import { t } from "@/lib/i18n/messages";

export default function Page() {
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-semibold">{t("pages.send.title")}</h1>
      <p className="mt-2">{t("common.notImplemented")}</p>
      <SavedClaimLinks />
    </main>
  );
}
