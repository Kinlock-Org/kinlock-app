"use client";

import { useId } from "react";
import { AmountDisplay } from "@/components/money/AmountDisplay";
import { DateTimeDisplay } from "@/components/time/DateTimeDisplay";
import { ASSET_CODE } from "@/lib/constants";
import { shortAddress } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/messages";
import { type IndexedPayee, LOCK_STATES } from "@/lib/indexer";
import { fromBaseUnits, publicConfig } from "@/lib/sdk";
import { usePayeeDashboard } from "./usePayeeDashboard";

/** The payee dashboard: connect, see every lock sent to this wallet, filter, find one. Roadmap M3-11. */
export function PayeeView({ payees }: { payees: IndexedPayee[] }) {
  const d = usePayeeDashboard(payees);
  const ids = { state: useId(), reference: useId(), referenceHint: useId() };

  if (!d.address) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={d.connect}
          className="self-start rounded border px-4 py-2 font-medium"
        >
          {t("pages.payee.connect")}
        </button>
        {d.error ? (
          <p role="alert" className="font-medium">
            {t(d.error)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <span>
        {t("pages.payee.connectedAs")}: <code title={d.address}>{shortAddress(d.address)}</code>
      </span>

      {d.payeeIds.length === 0 ? (
        <p role="alert">{t("pages.payee.notAPayee")}</p>
      ) : (
        <>
          <label htmlFor={ids.state} className="flex flex-col gap-1">
            <span className="font-medium">{t("pages.payee.stateLabel")}</span>
            <select
              id={ids.state}
              value={d.stateFilter}
              onChange={(e) =>
                d.setStateFilter(e.target.value as (typeof LOCK_STATES)[number] | "")
              }
              className="rounded border p-2"
            >
              <option value="">{t("pages.payee.stateAll")}</option>
              {LOCK_STATES.map((s) => (
                <option key={s} value={s}>
                  {t(`pages.claim.state.${s}`)}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor={ids.reference} className="flex flex-col gap-1">
            <span className="font-medium">{t("pages.payee.referenceLabel")}</span>
            <input
              id={ids.reference}
              value={d.referenceLink}
              onChange={(e) => d.checkReferenceLink(e.target.value)}
              aria-describedby={ids.referenceHint}
              className="rounded border p-2"
            />
            <span id={ids.referenceHint} className="text-sm">
              {t("pages.payee.referenceHint")}
            </span>
          </label>
          {d.referenceResult.status === "invalid" ? (
            <p role="alert">{t("pages.payee.referenceInvalid")}</p>
          ) : null}
          {d.referenceResult.status === "notFound" ? (
            <p role="alert">{t("pages.payee.referenceNotFound")}</p>
          ) : null}
          {d.referenceLink ? (
            <button
              type="button"
              onClick={d.clearReference}
              className="self-start underline underline-offset-4"
            >
              {t("pages.payee.clearFilter")}
            </button>
          ) : null}

          {d.phase === "loading" ? <p role="status">{t("pages.payee.loading")}</p> : null}
          {d.phase === "readFailed" ? <p role="alert">{t("pages.payee.readFailed")}</p> : null}
          {d.phase === "ready" && d.locks.length === 0 ? <p>{t("pages.payee.empty")}</p> : null}
          {d.phase === "ready" && d.locks.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {d.locks.map((lock) => (
                <LockRow key={lock.id} lock={lock} locale={d.locale} />
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}

function LockRow({
  lock,
  locale,
}: {
  lock: ReturnType<typeof usePayeeDashboard>["locks"][number];
  locale: string;
}) {
  const usdc = publicConfig();
  const createdSeconds = BigInt(Math.floor(Date.parse(lock.createdAt) / 1000));
  return (
    <li className="flex flex-col gap-2 rounded border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">
          {t("pages.payee.lockLabel")} {lock.id}
        </span>
        <span>{t(`pages.claim.state.${lock.state}`)}</span>
      </div>
      <div>
        {t("pages.payee.totalLabel")}:{" "}
        <AmountDisplay
          decimal={fromBaseUnits(BigInt(lock.total))}
          assetCode={ASSET_CODE}
          issuer={
            lock.token === usdc.NEXT_PUBLIC_USDC_CONTRACT_ID
              ? usdc.NEXT_PUBLIC_USDC_ISSUER
              : lock.token
          }
          locale={locale}
        />
      </div>
      <div>
        {t("pages.payee.createdLabel")}:{" "}
        <DateTimeDisplay unixSeconds={createdSeconds} locale={locale} />
      </div>
      <a href={`/claim/${lock.id}`} className="self-start underline underline-offset-4">
        {t("pages.payee.viewLink")}
      </a>
    </li>
  );
}
