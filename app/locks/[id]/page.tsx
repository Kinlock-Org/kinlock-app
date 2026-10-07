/** Sender lock detail. Reads CHAIN state; refund shown only when allowed. Roadmap M3-08. */
import { t } from "@/lib/i18n/messages";
import { LockView } from "./LockView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valid = /^[1-9]\d{0,19}$/.test(id) && BigInt(id) < 2n ** 64n;
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-semibold">{t("pages.lock.title")}</h1>
      {valid ? <LockView lockId={id} /> : <p role="alert">{t("pages.lock.invalidId")}</p>}
    </main>
  );
}
