import type { Lock, VerifyReceiptResult } from "@kinlock/sdk";
import { AmountDisplay } from "@/components/money/AmountDisplay";
import { DateTimeDisplay } from "@/components/time/DateTimeDisplay";
import { ASSET_CODE } from "@/lib/constants";
import { shortAddress } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/messages";
import { kindMessageKey, reasonMessageKey } from "@/lib/receipts/receipt-text";
import { fromBaseUnits } from "@/lib/sdk";

/**
 * The verification result, shared by `/r/[txHash]/[eventIndex]` and `/verify`. Shows "Payment to
 * verified payee" only when `result.valid` is actually true (hard rule 7: never claim it
 * otherwise). `lock` is a separate chain read for asset labeling only, not part of verification
 * itself; it's `null` whenever the lock entry is unavailable (expired from chain state), or
 * whenever `usdc` is `null` (the shared app config failed to load), in which case the amount is
 * shown without an asset label rather than guessing one.
 */
export function ReceiptResult({
  result,
  locale,
  lock,
  usdc,
}: {
  result: VerifyReceiptResult;
  locale: string;
  lock: Lock | null;
  usdc: { contractId: string; issuer: string } | null;
}) {
  const reasonKey = reasonMessageKey(result.reason);
  return (
    <section className="flex flex-col gap-3 rounded border p-3">
      <p className="text-lg font-semibold" aria-live="polite">
        {result.valid ? t("receipt.valid") : t("receipt.notValid")}
      </p>
      {result.valid ? <p className="font-medium">{t("receipt.headline")}</p> : null}
      {reasonKey ? <p role={result.valid ? "status" : "alert"}>{t(reasonKey)}</p> : null}
      {result.receipt ? <Details result={result} locale={locale} lock={lock} usdc={usdc} /> : null}
    </section>
  );
}

function Details({
  result,
  locale,
  lock,
  usdc,
}: {
  result: VerifyReceiptResult;
  locale: string;
  lock: Lock | null;
  usdc: { contractId: string; issuer: string } | null;
}) {
  const receipt = result.receipt;
  if (!receipt) return null;
  const ledgerTimeSeconds = receipt.ledgerTime
    ? BigInt(Math.floor(Date.parse(receipt.ledgerTime) / 1000))
    : null;
  return (
    <dl className="grid grid-cols-1 gap-1">
      {result.kind ? (
        <>
          <dt className="font-medium">{t("pages.claim.stateLabel")}</dt>
          <dd>{t(kindMessageKey(result.kind))}</dd>
        </>
      ) : null}
      <dt className="font-medium">{t("receipt.amountLabel")}</dt>
      <dd>
        {lock && usdc ? (
          <AmountDisplay
            decimal={fromBaseUnits(receipt.amount)}
            assetCode={ASSET_CODE}
            issuer={lock.token === usdc.contractId ? usdc.issuer : lock.token}
            locale={locale}
          />
        ) : (
          fromBaseUnits(receipt.amount)
        )}
      </dd>
      {receipt.trancheIndex !== undefined ? (
        <>
          <dt className="font-medium">{t("receipt.trancheLabel")}</dt>
          <dd>{receipt.trancheIndex + 1}</dd>
        </>
      ) : null}
      {receipt.payout ? (
        <>
          <dt className="font-medium">{t("receipt.payoutLabel")}</dt>
          <dd>
            <code title={receipt.payout}>{shortAddress(receipt.payout)}</code>
            <span className="sr-only">{receipt.payout}</span>
          </dd>
        </>
      ) : null}
      {receipt.refundReason ? (
        <>
          <dt className="font-medium">{t("receipt.refundReasonLabel")}</dt>
          <dd>{t(`pages.lock.refundAvailable.${receipt.refundReason}`)}</dd>
        </>
      ) : null}
      {ledgerTimeSeconds !== null ? (
        <>
          <dt className="font-medium">{t("receipt.ledgerTimeLabel")}</dt>
          <dd>
            <DateTimeDisplay unixSeconds={ledgerTimeSeconds} locale={locale} />
          </dd>
        </>
      ) : null}
    </dl>
  );
}
