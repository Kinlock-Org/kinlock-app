/** Receipt rebuilt from chain data. Copy: "Payment to verified payee". Roadmap M3-13. */

import { t } from "@/lib/i18n/messages";
import { isValidEventIndex, isValidTxHash } from "@/lib/receipts/parse";
import { ReceiptPageView } from "./ReceiptPageView";

export default async function Page({
  params,
}: {
  params: Promise<{ txHash: string; eventIndex: string }>;
}) {
  const { txHash, eventIndex } = await params;
  const valid = isValidTxHash(txHash) && isValidEventIndex(eventIndex);
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-semibold">{t("pages.receipt.title")}</h1>
      {valid ? (
        <div className="mt-4">
          <ReceiptPageView txHash={txHash} eventIndex={Number(eventIndex)} />
        </div>
      ) : (
        <p role="alert">{t("pages.receipt.invalidId")}</p>
      )}
    </main>
  );
}
