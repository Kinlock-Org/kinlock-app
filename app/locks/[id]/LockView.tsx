"use client";

import { trancheStatus } from "@/app/claim/[id]/claim-logic";
import { phaseMessage, statusMessage } from "@/app/claim/[id]/claim-view-text";
import { AmountDisplay } from "@/components/money/AmountDisplay";
import { DateTimeDisplay } from "@/components/time/DateTimeDisplay";
import { ASSET_CODE } from "@/lib/constants";
import { shortAddress } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/messages";
import { fromBaseUnits } from "@/lib/sdk";
import { type LockPage, useLockPage } from "./useLockPage";

/** The sender's view of a lock, from chain, with Refund only when allowed. Roadmap M3-08. */
export function LockView({ lockId }: { lockId: string }) {
  const p = useLockPage(lockId);
  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-sm">{t("pages.lock.intro")}</p>
      {phaseMessage(p.phase) ? (
        <p role="status">{t(phaseMessage(p.phase) ?? "pages.claim.loading")}</p>
      ) : null}
      {p.lock ? <Details p={p} /> : null}
    </div>
  );
}

function Amount({ p, baseUnits }: { p: LockPage; baseUnits: bigint }) {
  return p.lock?.token === p.usdc.contractId ? (
    <AmountDisplay
      decimal={fromBaseUnits(baseUnits)}
      assetCode={ASSET_CODE}
      issuer={p.usdc.issuer}
      locale={p.locale}
    />
  ) : (
    <span>
      {fromBaseUnits(baseUnits)} ({t("pages.claim.otherAsset")}:{" "}
      <code className="break-all">{p.lock?.token}</code>)
    </span>
  );
}

function Details({ p }: { p: LockPage }) {
  const lock = p.lock;
  if (!lock) return null;
  return (
    <>
      <dl className="grid grid-cols-1 gap-1">
        <dt className="font-medium">{t("pages.claim.stateLabel")}</dt>
        <dd>{t(`pages.claim.state.${lock.state}`)}</dd>
        <dt className="font-medium">{t("pages.claim.total")}</dt>
        <dd>
          <Amount p={p} baseUnits={lock.total} />
        </dd>
        <dt className="font-medium">{t("pages.lock.releasedLabel")}</dt>
        <dd>
          <Amount p={p} baseUnits={lock.released} />
        </dd>
        <dt className="font-medium">{t("pages.lock.returnedLabel")}</dt>
        <dd>
          <Amount p={p} baseUnits={lock.returned} />
        </dd>
        <dt className="font-medium">{t("pages.lock.payeeLabel")}</dt>
        <dd>
          {p.payee ? t(`pages.lock.payeeStatus.${p.payee.status}`) : t("pages.lock.payeeUnknown")}
        </dd>
        <dt className="font-medium">{t("pages.claim.payoutLabel")}</dt>
        <dd>
          <code title={lock.payout}>{shortAddress(lock.payout)}</code>
          <span className="sr-only">{lock.payout}</span>
        </dd>
        <dt className="font-medium">{t("pages.claim.expiresLabel")}</dt>
        <dd>
          <DateTimeDisplay unixSeconds={lock.expiresAt} locale={p.locale} />
        </dd>
      </dl>

      <section aria-labelledby="tranches-heading" className="flex flex-col gap-2">
        <h2 id="tranches-heading" className="text-xl font-semibold">
          {t("pages.claim.tranchesHeading")}
        </h2>
        <ol className="flex flex-col gap-2">
          {lock.tranches.map((tranche, i) => (
            <li
              key={tranche.unlockAt.toString() + String(i)}
              className="flex flex-col gap-1 rounded border p-3"
            >
              <span className="font-medium">
                {t("pages.claim.trancheLabel")} {i + 1}: <Amount p={p} baseUnits={tranche.amount} />
              </span>
              <span>
                {t("pages.claim.unlocksLabel")}:{" "}
                <DateTimeDisplay unixSeconds={tranche.unlockAt} locale={p.locale} />
              </span>
              <span>{t(statusMessage(trancheStatus(lock, i, p.now)))}</span>
            </li>
          ))}
        </ol>
      </section>

      <RefundPanel p={p} />
    </>
  );
}

function RefundPanel({ p }: { p: LockPage }) {
  const lock = p.lock;
  const e = p.eligibility;
  if (!lock || !e) return null;
  const mode = e.allowed ? "allowed" : e.from === null ? "never" : "later";
  return (
    <section aria-labelledby="refund-heading" className="flex flex-col gap-2 rounded border p-3">
      <h2 id="refund-heading" className="font-medium">
        {t("pages.lock.refundHeading")}
      </h2>
      {e.allowed ? <p>{t(`pages.lock.refundAvailable.${e.reason}`)}</p> : null}
      {mode === "allowed" ? (
        <p>
          {t("pages.lock.refundAmount")}:{" "}
          <Amount p={p} baseUnits={lock.total - lock.released - lock.returned} />
        </p>
      ) : null}
      {mode === "allowed" ? <SenderAction p={p} /> : null}
      {mode === "never" ? <p>{t("pages.lock.refundNever")}</p> : null}
      {!e.allowed && e.from !== null ? (
        <p>
          {t("pages.lock.refundFrom")}: <DateTimeDisplay unixSeconds={e.from} locale={p.locale} />
        </p>
      ) : null}
      {p.error ? (
        <p role="alert" className="font-medium">
          {t(p.error)}
        </p>
      ) : null}
      {p.receipt ? (
        <p role="status">
          {t("pages.lock.refunded")}{" "}
          {p.receipt.eventIndex === null ? null : (
            <a href={`/r/${p.receipt.txHash}/${p.receipt.eventIndex}`} className="underline">
              {t("pages.lock.receiptLink")}
            </a>
          )}
        </p>
      ) : null}
    </section>
  );
}

function SenderAction({ p }: { p: LockPage }) {
  const mode = p.address === null ? "connect" : p.isSender ? "refund" : "wrongAccount";
  return (
    <>
      {mode === "connect" ? (
        <button
          type="button"
          onClick={p.connect}
          className="self-start rounded border px-4 py-2 font-medium"
        >
          {t("pages.claim.connect")}
        </button>
      ) : null}
      {mode === "refund" ? (
        <button
          type="button"
          onClick={p.doRefund}
          disabled={p.busy}
          className="self-start rounded border px-4 py-2 font-medium"
        >
          {p.busy ? t("pages.lock.refunding") : t("pages.lock.refund")}
        </button>
      ) : null}
      {mode === "wrongAccount" ? <p role="alert">{t("pages.lock.refundSenderOnly")}</p> : null}
    </>
  );
}
