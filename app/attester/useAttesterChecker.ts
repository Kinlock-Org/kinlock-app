"use client";

import { useState } from "react";
import {
  type AttesterReadinessReport,
  checkPayoutAccountReadiness,
  InvalidAddressError,
} from "@/lib/attester/readiness";
import { isValidEd25519PublicKey } from "@/lib/attester/strkey";
import { t } from "@/lib/i18n/messages";

export interface UseAttesterCheckerOptions {
  usdcIssuer: string;
  network?: string;
  horizonUrl?: string;
}

export function useAttesterChecker({
  usdcIssuer,
  network = "testnet",
  horizonUrl,
}: UseAttesterCheckerOptions) {
  const [address, setAddress] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AttesterReadinessReport | null>(null);

  async function check() {
    const trimmed = address.trim();

    if (!isValidEd25519PublicKey(trimmed)) {
      setValidationError(t("pages.attester.errorInvalidAddress"));
      setReport(null);
      return;
    }

    setValidationError(null);
    setError(null);
    setIsLoading(true);

    try {
      const res = await checkPayoutAccountReadiness(trimmed, {
        network,
        assetCode: "USDC",
        assetIssuer: usdcIssuer,
        horizonUrl,
      });
      setReport(res);
    } catch (err) {
      if (err instanceof InvalidAddressError) {
        setValidationError(t("pages.attester.errorInvalidAddress"));
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddressChange(val: string) {
    setAddress(val);
    if (validationError) {
      setValidationError(null);
    }
  }

  return {
    address,
    handleAddressChange,
    validationError,
    isLoading,
    error,
    report,
    check,
  };
}
