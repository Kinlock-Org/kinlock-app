/** [sec] Payee claim. Reads CHAIN state; verifies the fragment reference client-side; no third-party scripts. Roadmap M3-09, M3-14. */
import { t } from "@/lib/i18n/messages";
import { ClaimView } from "./ClaimView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valid = /^[1-9]\d{0,19}$/.test(id) && BigInt(id) < 2n ** 64n;
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-semibold">{t("pages.claim.title")}</h1>
      {valid ? <ClaimView lockId={id} /> : <p role="alert">{t("pages.claim.invalidId")}</p>}
    </main>
  );
}
