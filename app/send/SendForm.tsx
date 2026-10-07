"use client";

import { useId } from "react";
import { unixSecondsOf } from "@/app/request/schedule";
import { AmountDisplay } from "@/components/money/AmountDisplay";
import { DateTimeDisplay } from "@/components/time/DateTimeDisplay";
import { ASSET_CODE, MAX_TRANCHES } from "@/lib/constants";
import { shortAddress } from "@/lib/i18n/format";
import { hasMessage, t } from "@/lib/i18n/messages";
import { fromBaseUnits } from "@/lib/sdk";
import { idsOf, localCurrencyOf, preflightKey } from "./send-logic";
import { type SendForm as Form, useSendForm } from "./useSendForm";

export interface PayeeOption {
  payeeId: string;
  label: string;
  localCurrency: string | null;
}

/** The sender flow. Markup only; state lives in useSendForm. Roadmap M3-06. */
export function SendForm({ payees, issuer }: { payees: PayeeOption[]; issuer: string }) {
  const f = useSendForm(idsOf(payees));
  return f.stage === "done" ? <Done f={f} /> : <Editor f={f} payees={payees} issuer={issuer} />;
}

function Editor({ f, payees, issuer }: { f: Form; payees: PayeeOption[]; issuer: string }) {
  const ids = {
    payee: useId(),
    reference: useId(),
    referenceHint: useId(),
    expiry: useId(),
    expiryHint: useId(),
  };
  const localCurrency = localCurrencyOf(payees, f.payeeId);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void f.review();
      }}
      className="mt-6 flex flex-col gap-4"
      noValidate
    >
      {f.prefilled ? (
        <p className="rounded border p-3 text-sm">{t("pages.send.prefilled")}</p>
      ) : null}
      {f.unknownPayee ? <p role="alert">{t("pages.send.prefillUnknownPayee")}</p> : null}

      <label htmlFor={ids.payee} className="flex flex-col gap-1">
        <span className="font-medium">{t("pages.send.payeeLabel")}</span>
        <select
          id={ids.payee}
          value={f.payeeId}
          onChange={(e) => f.setPayeeId(e.target.value)}
          className="rounded border p-2"
        >
          {payees.map((p) => (
            <option key={p.payeeId} value={p.payeeId} dir="auto">
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor={ids.reference} className="flex flex-col gap-1">
        <span className="font-medium">{t("pages.send.referenceLabel")}</span>
        <input
          id={ids.reference}
          value={f.reference}
          onChange={(e) => f.setReference(e.target.value)}
          aria-describedby={ids.referenceHint}
          dir="auto"
          className="rounded border p-2"
        />
        <span id={ids.referenceHint} className="text-sm">
          {t("pages.send.referenceHint")}
        </span>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-medium">{t("pages.send.scheduleHeading")}</legend>
        {f.rows.map((row, i) => (
          <div key={row.key} className="flex flex-col gap-2 rounded border p-3">
            <span className="text-sm">
              {t("pages.send.trancheLabel")} {i + 1}
            </span>
            <label className="flex flex-col gap-1">
              <span>{t("pages.send.amountLabel")}</span>
              <input
                inputMode="decimal"
                value={row.amount}
                onChange={(e) => f.updateRow(row.key, { amount: e.target.value })}
                className="rounded border p-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>{t("pages.send.unlockLabel")}</span>
              <input
                type="date"
                value={row.date}
                onChange={(e) => f.updateRow(row.key, { date: e.target.value })}
                className="rounded border p-2"
              />
            </label>
            {row.date ? (
              <DateTimeDisplay unixSeconds={unixSecondsOf(row.date)} locale={f.locale} />
            ) : null}
            {f.rows.length > 1 ? (
              <button
                type="button"
                onClick={() => f.removeRow(row.key)}
                className="self-start underline"
              >
                {t("pages.send.removeTranche")}
              </button>
            ) : null}
          </div>
        ))}
        {f.rows.length < MAX_TRANCHES ? (
          <button type="button" onClick={f.addRow} className="self-start underline">
            {t("pages.send.addTranche")}
          </button>
        ) : null}
      </fieldset>

      <label htmlFor={ids.expiry} className="flex flex-col gap-1">
        <span className="font-medium">{t("pages.send.expiryLabel")}</span>
        <input
          id={ids.expiry}
          type="date"
          value={f.expiryDate}
          onChange={(e) => f.setExpiryDate(e.target.value)}
          aria-describedby={ids.expiryHint}
          className="rounded border p-2"
        />
        <span id={ids.expiryHint} className="text-sm">
          {t("pages.send.expiryHint")}
        </span>
        {f.expiryDate ? (
          <DateTimeDisplay unixSeconds={unixSecondsOf(f.expiryDate)} locale={f.locale} />
        ) : null}
      </label>

      {f.totalBase ? (
        <p>
          {t("pages.send.total")}:{" "}
          <AmountDisplay
            decimal={fromBaseUnits(f.totalBase)}
            assetCode={ASSET_CODE}
            issuer={issuer}
            locale={f.locale}
            localCurrency={localCurrency}
          />
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <span className="font-medium">{t("pages.send.walletLabel")}</span>
        {f.address ? (
          <code title={f.address}>{shortAddress(f.address)}</code>
        ) : (
          <button type="button" onClick={f.connect} className="self-start rounded border px-4 py-2">
            {t("pages.send.connect")}
          </button>
        )}
      </div>

      {f.error ? (
        <p role="alert" className="font-medium">
          {t(f.error)}
        </p>
      ) : null}

      {f.stage === "edit" ? (
        <button
          type="submit"
          disabled={f.checking}
          className="self-start rounded border px-4 py-2 font-medium"
        >
          {f.checking ? t("pages.send.checking") : t("pages.send.review")}
        </button>
      ) : (
        <Review f={f} />
      )}
    </form>
  );
}

function Review({ f }: { f: Form }) {
  return (
    <section aria-labelledby="preflight-heading" className="flex flex-col gap-2 rounded border p-3">
      <h2 id="preflight-heading" className="font-semibold">
        {t("pages.send.preflightHeading")}
      </h2>
      <ul className="flex flex-col gap-1">
        {f.results.map((r) => (
          <li key={r.check} className={r.status === "fail" ? "font-medium" : undefined}>
            {t(`preflight.status.${r.status}`)}: {t(preflightKey(r, hasMessage))}
          </li>
        ))}
      </ul>
      {f.verdict === "blocked" ? <p role="alert">{t("pages.send.blocked")}</p> : null}
      {f.verdict === "needsAcknowledgement" ? (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={f.acknowledged}
            onChange={(e) => f.setAcknowledged(e.target.checked)}
          />
          <span>{t("pages.send.acknowledge")}</span>
        </label>
      ) : null}
      <span className="flex gap-3">
        <button
          type="button"
          onClick={f.send}
          disabled={!f.canSend}
          className="rounded border px-4 py-2 font-medium disabled:opacity-50"
        >
          {f.stage === "sending" ? t("pages.send.sending") : t("pages.send.send")}
        </button>
        <button
          type="button"
          onClick={f.backToEdit}
          disabled={f.stage === "sending"}
          className="underline"
        >
          {t("pages.send.edit")}
        </button>
      </span>
    </section>
  );
}

function Done({ f }: { f: Form }) {
  const done = f.done;
  if (!done) return null;
  return (
    <section aria-live="polite" className="mt-6 flex flex-col gap-3 rounded border p-3">
      <h2 className="text-xl font-semibold">{t("pages.send.doneHeading")}</h2>
      <p>
        {t("pages.send.doneLock")}: {done.lockId}
      </p>
      <span className="font-medium">{t("pages.send.doneClaimLink")}</span>
      <output className="break-all rounded border p-2">{done.claimLink}</output>
      <p role={done.saved ? undefined : "alert"}>
        {done.saved ? t("pages.send.doneShare") : t("pages.send.doneNotSaved")}
      </p>
      <span className="flex flex-wrap gap-3">
        <button type="button" onClick={f.copy} className="rounded border px-4 py-2">
          {f.copied ? t("pages.send.copied") : t("pages.send.copy")}
        </button>
        <a href={`/locks/${done.lockId}`} className="underline">
          {t("pages.send.viewLock")}
        </a>
        <button type="button" onClick={f.reset} className="underline">
          {t("pages.send.sendAnother")}
        </button>
      </span>
    </section>
  );
}
