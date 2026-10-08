/** Payee dashboard: every lock sent to the connected wallet. Roadmap M3-11. */

import { t } from "@/lib/i18n/messages";
import { type IndexedPayee, listPayees } from "@/lib/indexer";
import { PayeeView } from "./PayeeView";

export const dynamic = "force-dynamic";

export default async function Page() {
  let payees: IndexedPayee[] | null = null;
  try {
    payees = await listPayees();
  } catch {
    payees = null;
  }
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-semibold">{t("pages.payee.title")}</h1>
      <p className="mt-2">{t("pages.payee.intro")}</p>
      {payees === null ? (
        <p role="alert" className="mt-4">
          {t("pages.payee.indexerDown")}
        </p>
      ) : (
        <PayeeView payees={payees} />
      )}
    </main>
  );
}
