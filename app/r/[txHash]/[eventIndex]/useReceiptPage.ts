/**
 * State for the receipt page (kept out of the .tsx so it holds markup only). Roadmap M3-13.
 * Verification comes only from `verifyReceipt` (chain data, tiered). `getLock` is a second,
 * separate chain read used only to label the asset; its absence never affects validity.
 */
import type { Lock, VerifyReceiptResult } from "@kinlock/sdk";
import { useEffect, useState } from "react";
import { getLock, publicConfig, verifyReceipt } from "@/lib/sdk";

type Phase = "loading" | "readFailed" | "ready";

export function useReceiptPage(txHash: string, eventIndex: number) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<VerifyReceiptResult | null>(null);
  const [lock, setLock] = useState<Lock | null>(null);
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    let cancelled = false;
    setLocale(navigator.language);
    (async () => {
      try {
        const r = await verifyReceipt({ txHash, eventIndex });
        if (cancelled) return;
        setResult(r);
        setPhase("ready");
        if (r.receipt) {
          const l = await getLock(r.receipt.lockId).catch(() => null);
          if (!cancelled) setLock(l);
        }
      } catch {
        if (!cancelled) setPhase("readFailed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txHash, eventIndex]);

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

  return { phase, result, lock, locale, usdc };
}
