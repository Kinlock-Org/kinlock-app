"use client";

import { useId } from "react";
import { DateTimeDisplay } from "@/components/time/DateTimeDisplay";
import { MAX_TRANCHES } from "@/lib/constants";
import { formatTokenAmount } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/messages";
import { unixSecondsOf } from "./schedule";
import { useRequestForm } from "./useRequestForm";

/** The payee's request form. Markup only; state lives in useRequestForm. */
export function RequestForm({ payees }: { payees: { payeeId: string; label: string }[] }) {
  const ids = { payee: useId(), reference: useId(), referenceHint: useId() };
  const f = useRequestForm(payees[0]?.payeeId ?? "");
  return (
    <form onSubmit={f.create} className="mt-6 flex flex-col gap-4" noValidate>
      <label htmlFor={ids.payee} className="flex flex-col gap-1">
        <span className="font-medium">{t("pages.request.payeeLabel")}</span>
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
        <span className="font-medium">{t("pages.request.referenceLabel")}</span>
        <input
          id={ids.reference}
          value={f.reference}
          onChange={(e) => f.setReference(e.target.value)}
          aria-describedby={ids.referenceHint}
          dir="auto"
          className="rounded border p-2"
        />
        <span id={ids.referenceHint} className="text-sm">
          {t("pages.request.referenceHint")}
        </span>
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-medium">{t("pages.request.scheduleHeading")}</legend>
        {f.rows.map((row, i) => (
          <div key={row.key} className="flex flex-col gap-2 rounded border p-3">
            <span className="text-sm">
              {t("pages.request.trancheLabel")} {i + 1}
            </span>
            <label className="flex flex-col gap-1">
              <span>{t("pages.request.amountLabel")}</span>
              <input
                inputMode="decimal"
                value={row.amount}
                onChange={(e) => f.updateRow(row.key, { amount: e.target.value })}
                className="rounded border p-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>{t("pages.request.unlockLabel")}</span>
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
                {t("pages.request.removeTranche")}
              </button>
            ) : null}
          </div>
        ))}
        {f.rows.length < MAX_TRANCHES ? (
          <button type="button" onClick={f.addRow} className="self-start underline">
            {t("pages.request.addTranche")}
          </button>
        ) : null}
      </fieldset>

      {f.total ? (
        <p>
          {t("pages.request.total")}: {formatTokenAmount(f.total, f.locale)}
        </p>
      ) : null}

      {f.error ? (
        <p role="alert" className="font-medium">
          {t(f.error)}
        </p>
      ) : null}

      <button type="submit" className="self-start rounded border px-4 py-2 font-medium">
        {t("pages.request.create")}
      </button>

      {f.link ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <span className="font-medium">{t("pages.request.linkLabel")}</span>
          <output className="break-all rounded border p-2">{f.link}</output>
          <button type="button" onClick={f.copy} className="self-start rounded border px-4 py-2">
            {f.copied ? t("pages.request.copied") : t("pages.request.copy")}
          </button>
        </div>
      ) : null}
    </form>
  );
}
