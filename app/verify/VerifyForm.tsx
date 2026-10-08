"use client";

import { useId } from "react";
import { ReceiptResult } from "@/components/receipts/ReceiptResult";
import { t } from "@/lib/i18n/messages";
import { useVerifyForm } from "./useVerifyForm";

/** The verify form. Markup only; state lives in useVerifyForm. */
export function VerifyForm() {
  const ids = { link: useId(), linkHint: useId(), eventIndex: useId(), eventIndexHint: useId() };
  const f = useVerifyForm();
  return (
    <>
      <form onSubmit={f.check} className="mt-6 flex flex-col gap-4" noValidate>
        <label htmlFor={ids.link} className="flex flex-col gap-1">
          <span className="font-medium">{t("pages.verify.linkLabel")}</span>
          <input
            id={ids.link}
            value={f.link}
            onChange={(e) => f.setLink(e.target.value)}
            aria-describedby={ids.linkHint}
            dir="auto"
            className="rounded border p-2"
          />
          <span id={ids.linkHint} className="text-sm">
            {t("pages.verify.linkHint")}
          </span>
        </label>

        <label htmlFor={ids.eventIndex} className="flex flex-col gap-1">
          <span className="font-medium">{t("pages.verify.eventIndexLabel")}</span>
          <input
            id={ids.eventIndex}
            inputMode="numeric"
            value={f.eventIndexField}
            onChange={(e) => f.setEventIndexField(e.target.value)}
            aria-describedby={ids.eventIndexHint}
            className="rounded border p-2"
          />
          <span id={ids.eventIndexHint} className="text-sm">
            {t("pages.verify.eventIndexHint")}
          </span>
        </label>

        {f.error ? (
          <p role="alert" className="font-medium">
            {t(f.error)}
          </p>
        ) : null}

        <button type="submit" className="self-start rounded border px-4 py-2 font-medium">
          {f.checking ? t("pages.verify.checking") : t("pages.verify.check")}
        </button>
      </form>

      {f.result ? (
        <div className="mt-4">
          <ReceiptResult result={f.result} locale={f.locale} lock={f.lock} usdc={f.usdc} />
        </div>
      ) : null}
    </>
  );
}
