/**
 * [sec] State for the claim page (kept out of the .tsx so it holds markup only). Roadmap M3-09.
 * The lock is read from CHAIN (never the indexer). The reference and salt come from the URL
 * fragment, are used only in this browser to recompute `ref_hash`, and are never sent anywhere.
 */
import type { Lock } from "@kinlock/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  computeRefHash,
  getLock,
  parseClaimLink,
  publicConfig,
  release,
  verifyReceipt,
  walletSigner,
} from "@/lib/sdk";
import { createStellarWalletsKitAdapter, type WalletAdapter } from "@/lib/wallet";
import {
  checkReference,
  findReceiptIndex,
  type ReferenceCheck,
  releaseErrorKey,
} from "./claim-logic";

type Phase = "loading" | "notFound" | "readFailed" | "ready";

/** The fragment's reference and salt, if this page was opened from a valid claim link. */
function fragmentParts(lockId: bigint): { reference: string; salt: string } | null {
  try {
    const parts = parseClaimLink(window.location.href);
    return parts.lockId === lockId ? { reference: parts.reference, salt: parts.salt } : null;
  } catch {
    return null;
  }
}

export function useClaim(lockIdText: string) {
  const lockId = BigInt(lockIdText);
  const wallet = useRef<WalletAdapter | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [lock, setLock] = useState<Lock | null>(null);
  const [reference, setReference] = useState<ReferenceCheck>({ status: "missing" });
  const [locale, setLocale] = useState("en");
  const [now, setNow] = useState(() => BigInt(Math.floor(Date.now() / 1000)));
  const [address, setAddress] = useState<string | null>(null);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [receipt, setReceipt] = useState<{ txHash: string; eventIndex: number | null } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const fresh = await getLock(lockId);
      if (!fresh) return setPhase("notFound");
      setLock(fresh);
      setReference(await checkReference(fragmentParts(lockId), fresh, computeRefHash));
      setNow(BigInt(Math.floor(Date.now() / 1000)));
      setPhase("ready");
    } catch {
      setPhase("readFailed");
    }
  }, [lockId]);

  useEffect(() => {
    setLocale(navigator.language);
    void load();
  }, [load]);

  // A different link opened on the same page changes only the fragment (no reload): re-check it.
  useEffect(() => {
    if (!lock) return;
    const recheck = () => {
      void checkReference(fragmentParts(lockId), lock, computeRefHash).then(setReference);
    };
    window.addEventListener("hashchange", recheck);
    return () => window.removeEventListener("hashchange", recheck);
  }, [lock, lockId]);

  async function connect() {
    setError(null);
    wallet.current ??= createStellarWalletsKitAdapter(publicConfig().networkPassphrase);
    try {
      setAddress(await wallet.current.connect());
    } catch {
      setError("pages.claim.errorTx");
    }
  }

  async function claim(trancheIndex: number) {
    if (!wallet.current || !address) return;
    setError(null);
    setReceipt(null);
    setBusyIndex(trancheIndex);
    try {
      const { txHash } = await release(lockId, trancheIndex, walletSigner(wallet.current, address));
      setReceipt({ txHash, eventIndex: null });
      await load();
      setReceipt({ txHash, eventIndex: await findReceiptIndex(txHash, verifyReceipt) });
    } catch (e) {
      setError(releaseErrorKey(e));
    } finally {
      setBusyIndex(null);
    }
  }

  const config = publicConfig();
  return {
    phase,
    lock,
    reference,
    locale,
    now,
    address,
    isPayout: lock !== null && address === lock.payout,
    busyIndex,
    error,
    receipt,
    usdc: {
      contractId: config.NEXT_PUBLIC_USDC_CONTRACT_ID,
      issuer: config.NEXT_PUBLIC_USDC_ISSUER,
    },
    connect,
    claim,
  };
}

export type Claim = ReturnType<typeof useClaim>;
