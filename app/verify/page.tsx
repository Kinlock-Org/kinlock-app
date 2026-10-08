/** Paste a receipt link or hash to verify. Roadmap M3-13. */
import { t } from "@/lib/i18n/messages";
import { VerifyForm } from "./VerifyForm";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-semibold">{t("pages.verify.title")}</h1>
      <p className="mt-2">{t("pages.verify.intro")}</p>
      <VerifyForm />
    </main>
  );
}
