/** Payee dashboard: every lock sent to the connected wallet. Roadmap M3-11. */

import { LagNotice } from "@/components/indexer/LagNotice";
import { t } from "@/lib/i18n/messages";
import { type IndexedPayee, indexerLagging, listPayees } from "@/lib/indexer";
import { PayeeView } from "./PayeeView";

export const dynamic = "force-dynamic";

export default async function Page() {
  let payees: IndexedPayee[] | null = null;
  let lagging = false;
  try {
    [payees, lagging] = await Promise.all([listPayees(), indexerLagging()]);
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
        <>
          <LagNotice lagging={lagging} />
          <PayeeView payees={payees} />
        </>
      )}
    </main>
  );
}
