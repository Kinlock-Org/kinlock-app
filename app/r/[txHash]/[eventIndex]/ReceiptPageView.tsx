"use client";

import { ReceiptResult } from "@/components/receipts/ReceiptResult";
import { t } from "@/lib/i18n/messages";
import { useReceiptPage } from "./useReceiptPage";

/** The receipt page: verifies from chain data and shows the result. Roadmap M3-13. */
export function ReceiptPageView({ txHash, eventIndex }: { txHash: string; eventIndex: number }) {
  const p = useReceiptPage(txHash, eventIndex);
  return (
    <>
      {p.phase === "loading" ? <p role="status">{t("pages.receipt.loading")}</p> : null}
      {p.phase === "readFailed" ? <p role="alert">{t("pages.receipt.readFailed")}</p> : null}
      {p.phase === "ready" && p.result ? (
        <ReceiptResult result={p.result} locale={p.locale} lock={p.lock} usdc={p.usdc} />
      ) : null}
    </>
  );
}
