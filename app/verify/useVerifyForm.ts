/** State and actions for the verify form (kept out of the .tsx so it holds markup only). */
import type { Lock, VerifyReceiptResult } from "@kinlock/sdk";
import { useState } from "react";
import type { MessageKey } from "@/lib/i18n/messages";
import { parseVerifyInput } from "@/lib/receipts/parse";
import { getLock, publicConfig, verifyReceipt } from "@/lib/sdk";

export function useVerifyForm() {
  const [link, setLinkValue] = useState("");
  const [eventIndexField, setEventIndexFieldValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [result, setResult] = useState<VerifyReceiptResult | null>(null);
  const [lock, setLock] = useState<Lock | null>(null);
  const [locale, setLocale] = useState("en");

  const setLink = (value: string) => {
    setLinkValue(value);
    setResult(null);
  };
  const setEventIndexField = (value: string) => {
    setEventIndexFieldValue(value);
    setResult(null);
  };

  async function check(event: { preventDefault(): void }) {
    event.preventDefault();
    setLocale(navigator.language);
    setError(null);
    setResult(null);
    setLock(null);
    const parsed = parseVerifyInput(link, eventIndexField);
    if (!parsed.ok) {
      setError(
        parsed.error === "input" ? "pages.verify.errorInput" : "pages.verify.errorEventIndex",
      );
      return;
    }
    setChecking(true);
    try {
      const r = await verifyReceipt({ txHash: parsed.txHash, eventIndex: parsed.eventIndex });
      setResult(r);
      if (r.receipt) {
        const l = await getLock(r.receipt.lockId).catch(() => null);
        setLock(l);
      }
    } catch {
      setError("pages.verify.errorGeneric");
    } finally {
      setChecking(false);
    }
  }

  // publicConfig() validates the whole shared config (including the indexer URL, which this
  // page never uses) and throws if any of it is missing; asset labeling is display-only, so a
  // bad or incomplete config degrades to no label rather than failing the page.
  let usdc: { contractId: string; issuer: string } | null = null;
  try {
    const config = publicConfig();
    usdc = {
      contractId: config.NEXT_PUBLIC_USDC_CONTRACT_ID,
      issuer: config.NEXT_PUBLIC_USDC_ISSUER,
    };
  } catch {
    usdc = null;
  }

  return {
    link,
    setLink,
    eventIndexField,
    setEventIndexField,
    checking,
    error,
    result,
    lock,
    locale,
    check,
    usdc,
  };
}
