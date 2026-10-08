"use client";

import { useEffect, useRef } from "react";
import { AmountDisplay } from "@/components/money/AmountDisplay";
import { DateTimeDisplay } from "@/components/time/DateTimeDisplay";
import { ASSET_CODE } from "@/lib/constants";
import { shortAddress } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/messages";
import { fromBaseUnits } from "@/lib/sdk";
import { canDecline, remainder, trancheStatus } from "./claim-logic";
import { phaseMessage, referenceMessage, statusMessage } from "./claim-view-text";
import { type Claim, useClaim } from "./useClaim";

/** [sec] The payee's claim page. Markup only; state lives in useClaim. Roadmap M3-09. */
export function ClaimView({ lockId }: { lockId: string }) {
  const c = useClaim(lockId);
  return (
    <div className="mt-4 flex flex-col gap-4">
      {phaseMessage(c.phase) ? (
        <p role="status">{t(phaseMessage(c.phase) ?? "pages.claim.loading")}</p>
      ) : null}
      {c.lock ? <LockDetails c={c} /> : null}
    </div>
  );
}

function Amount({ c, baseUnits }: { c: Claim; baseUnits: bigint }) {
  return c.lock?.token === c.usdc.contractId ? (
    <AmountDisplay
      decimal={fromBaseUnits(baseUnits)}
      assetCode={ASSET_CODE}
      issuer={c.usdc.issuer}
      locale={c.locale}
    />
  ) : (
    <span>
      {fromBaseUnits(baseUnits)} ({t("pages.claim.otherAsset")}:{" "}
      <code className="break-all">{c.lock?.token}</code>)
    </span>
  );
}

function LockDetails({ c }: { c: Claim }) {
  const lock = c.lock;
  if (!lock) return null;
  return (
    <>
      <dl className="grid grid-cols-1 gap-1">
        <dt className="font-medium">{t("pages.claim.lockLabel")}</dt>
        <dd>{lock.id.toString()}</dd>
        <dt className="font-medium">{t("pages.claim.stateLabel")}</dt>
        <dd>{t(`pages.claim.state.${lock.state}`)}</dd>
        <dt className="font-medium">{t("pages.claim.total")}</dt>
        <dd>
          <Amount c={c} baseUnits={lock.total} />
        </dd>
        <dt className="font-medium">{t("pages.claim.payoutLabel")}</dt>
        <dd>
          <code title={lock.payout}>{shortAddress(lock.payout)}</code>
          <span className="sr-only">{lock.payout}</span>
        </dd>
        <dt className="font-medium">{t("pages.claim.expiresLabel")}</dt>
        <dd>
          <DateTimeDisplay unixSeconds={lock.expiresAt} locale={c.locale} />
        </dd>
      </dl>

      <section aria-labelledby="reference-heading" className="rounded border p-3">
        <h2 id="reference-heading" className="font-medium">
          {t("pages.claim.referenceLabel")}
        </h2>
        {c.reference.status === "missing" ? null : (
          <p dir="auto" className="font-mono">
            {c.reference.reference}
          </p>
        )}
        <p role={c.reference.status === "match" ? undefined : "alert"}>
          {t(referenceMessage(c.reference.status))}
        </p>
      </section>

      <WalletBar c={c} />

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
                {t("pages.claim.trancheLabel")} {i + 1}: <Amount c={c} baseUnits={tranche.amount} />
              </span>
              <span>
                {t("pages.claim.unlocksLabel")}:{" "}
                <DateTimeDisplay unixSeconds={tranche.unlockAt} locale={c.locale} />
              </span>
              <span>{t(statusMessage(trancheStatus(lock, i, c.now)))}</span>
              {trancheStatus(lock, i, c.now) === "claimable" && c.isPayout ? (
                <button
                  type="button"
                  onClick={() => c.claim(i)}
                  disabled={c.busyIndex !== null}
                  className="self-start rounded border px-4 py-2 font-medium"
                >
                  {c.busyIndex === i ? t("pages.claim.releasing") : t("pages.claim.release")}
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {canDecline(lock, c.isPayout) ? <DeclinePanel c={c} /> : null}

      {c.error ? (
        <p role="alert" className="font-medium">
          {t(c.error)}
        </p>
      ) : null}
      {c.receipt ? (
        <p role="status">
          {c.receipt.kind === "Declined" ? t("pages.claim.declined") : t("pages.claim.released")}{" "}
          {c.receipt.eventIndex === null ? null : (
            <a href={`/r/${c.receipt.txHash}/${c.receipt.eventIndex}`} className="underline">
              {t("pages.claim.receiptLink")}
            </a>
          )}
        </p>
      ) : null}
    </>
  );
}

function WalletBar({ c }: { c: Claim }) {
  return c.address ? (
    <div className="flex flex-col gap-1">
      <span>
        {t("pages.claim.connectedAs")}: <code title={c.address}>{shortAddress(c.address)}</code>
      </span>
      {c.isPayout ? null : <p role="alert">{t("pages.claim.wrongAccount")}</p>}
    </div>
  ) : (
    <button
      type="button"
      onClick={c.connect}
      className="self-start rounded border px-4 py-2 font-medium"
    >
      {t("pages.claim.connect")}
    </button>
  );
}

/**
 * Decline with an explicit confirmation step showing exactly what goes back. Roadmap M3-10.
 * Focus moves into the alertdialog on open: without this, a screen-reader user who triggers it
 * has no way to know the confirmation appeared, since nothing else on the page changes.
 */
function DeclinePanel({ c }: { c: Claim }) {
  const confirmTitleRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (c.confirmingDecline) confirmTitleRef.current?.focus();
  }, [c.confirmingDecline]);
  return (
    <section aria-labelledby="decline-heading" className="flex flex-col gap-2 rounded border p-3">
      <h2 id="decline-heading" className="font-medium">
        {t("pages.claim.declineHeading")}
      </h2>
      <p>{t("pages.claim.declineIntro")}</p>
      {c.confirmingDecline ? (
        <div
          role="alertdialog"
          aria-labelledby="decline-confirm-title"
          className="flex flex-col gap-2"
        >
          <p
            id="decline-confirm-title"
            ref={confirmTitleRef}
            tabIndex={-1}
            className="font-semibold"
          >
            {t("pages.claim.declineConfirmTitle")}
          </p>
          <p>
            {t("pages.claim.declineConfirmAmount")}:{" "}
            <Amount c={c} baseUnits={c.lock ? remainder(c.lock) : 0n} />
          </p>
          <p>{t("pages.claim.declineConfirmNote")}</p>
          <span className="flex gap-3">
            <button
              type="button"
              onClick={c.confirmDecline}
              disabled={c.declining}
              className="rounded border px-4 py-2 font-medium"
            >
              {c.declining ? t("pages.claim.declining") : t("pages.claim.declineConfirm")}
            </button>
            <button
              type="button"
              onClick={c.cancelDecline}
              disabled={c.declining}
              className="underline"
            >
              {t("pages.claim.declineCancel")}
            </button>
          </span>
        </div>
      ) : (
        <button type="button" onClick={c.askDecline} className="self-start underline">
          {t("pages.claim.decline")}
        </button>
      )}
    </section>
  );
}
