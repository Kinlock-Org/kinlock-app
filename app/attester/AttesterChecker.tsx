"use client";

import { AssetLabel } from "@/components/money/AssetLabel";
import { t } from "@/lib/i18n/messages";
import { useAttesterChecker } from "./useAttesterChecker";

export interface AttesterCheckerProps {
  usdcIssuer: string;
  network?: string;
  horizonUrl?: string;
}

export function AttesterChecker({ usdcIssuer, network, horizonUrl }: AttesterCheckerProps) {
  const { address, handleAddressChange, validationError, isLoading, error, report, check } =
    useAttesterChecker({
      usdcIssuer,
      network,
      horizonUrl,
    });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="payout-address-input" className="block text-sm font-medium text-ink">
            {t("pages.attester.addressLabel")}
          </label>
          <div className="mt-1">
            <input
              id="payout-address-input"
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder={t("pages.attester.addressPlaceholder")}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-ink shadow-xs focus:border-accent focus:ring-2 focus:ring-accent focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <p className="mt-1 text-xs text-muted">{t("pages.attester.addressHelp")}</p>
          {validationError && (
            <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400 font-medium">
              {validationError}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-xs hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
          >
            {isLoading ? t("pages.attester.checking") : t("pages.attester.checkButton")}
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50"
        >
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {report && (
        <div
          role="status"
          aria-live="polite"
          className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">{t("pages.attester.summaryHeading")}</h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                report.problemsCount === 0
                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
              }`}
            >
              {report.problemsCount === 0
                ? t("pages.attester.summaryAllPass")
                : `${report.problemsCount} ${t("pages.attester.summaryProblems")}`}
            </span>
          </div>

          <div className="grid gap-4">
            {/* 1. Account existence */}
            <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{t("pages.attester.accountLabel")}</span>
                <span
                  className={`text-sm font-medium ${report.account.status === "pass" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {report.account.status === "pass"
                    ? t("pages.attester.accountPass")
                    : t("pages.attester.accountFail")}
                </span>
              </div>
              {report.account.status === "fail" && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  {t("pages.attester.accountAction")}
                </p>
              )}
            </div>

            {/* 2. Native XLM float */}
            <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{t("pages.attester.xlmLabel")}</span>
                <span
                  className={`text-sm font-medium ${report.xlm?.status === "pass" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {report.xlm?.status === "pass"
                    ? t("pages.attester.xlmPass")
                    : t("pages.attester.xlmFail")}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>{report.xlm ? `${report.xlm.balance} XLM` : "0 XLM"}</span>
                <span>{t("pages.attester.xlmReserveExplanation")}</span>
              </div>
              {report.xlm?.status === "fail" && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  {t("pages.attester.xlmAction")}
                </p>
              )}
            </div>

            {/* 3. USDC trustline */}
            <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{t("pages.attester.trustlineLabel")}</span>
                  <AssetLabel code="USDC" issuer={usdcIssuer} />
                </div>
                <span
                  className={`text-sm font-medium ${report.trustline.status === "pass" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {report.trustline.kind === "authorised" && t("pages.attester.trustlinePass")}
                  {report.trustline.kind === "absent" && t("pages.attester.trustlineAbsent")}
                  {report.trustline.kind === "unauthorised" &&
                    t("pages.attester.trustlineUnauthorised")}
                  {report.trustline.kind === "no_room" && t("pages.attester.trustlineNoRoom")}
                </span>
              </div>
              {report.trustline.status === "fail" && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  {report.trustline.kind === "absent" && t("pages.attester.trustlineAbsentAction")}
                  {report.trustline.kind === "unauthorised" &&
                    t("pages.attester.trustlineUnauthorisedAction")}
                  {report.trustline.kind === "no_room" && t("pages.attester.trustlineNoRoomAction")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md bg-neutral-50 p-4 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <p className="text-xs text-muted leading-relaxed">{t("pages.attester.readOnlyNotice")}</p>
      </div>
    </div>
  );
}
