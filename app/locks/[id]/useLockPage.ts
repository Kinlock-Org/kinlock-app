/**
 * State for the sender's lock page (kept out of the .tsx so it holds markup only). Roadmap M3-08.
 * Lock and payee are read from CHAIN; refund is offered only when `refundEligibility` allows it
 * and the connected wallet is the lock's sender.
 */
import type { Lock, Payee } from "@kinlock/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { findReceiptIndex } from "@/app/claim/[id]/claim-logic";
import type { MessageKey } from "@/lib/i18n/messages";
import { refundEligibility } from "@/lib/locks/refund";
import { getLock, getPayee, publicConfig, refund, verifyReceipt, walletSigner } from "@/lib/sdk";
import { createStellarWalletsKitAdapter, type WalletAdapter } from "@/lib/wallet";
import { refundErrorKey } from "./lock-view-text";

type Phase = "loading" | "notFound" | "readFailed" | "ready";

export function useLockPage(lockIdText: string) {
  const lockId = BigInt(lockIdText);
  const wallet = useRef<WalletAdapter | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [lock, setLock] = useState<Lock | null>(null);
  const [payee, setPayee] = useState<Payee | null>(null);
  const [locale, setLocale] = useState("en");
  const [now, setNow] = useState(() => BigInt(Math.floor(Date.now() / 1000)));
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [receipt, setReceipt] = useState<{ txHash: string; eventIndex: number | null } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const fresh = await getLock(lockId);
      if (!fresh) return setPhase("notFound");
      setLock(fresh);
      setPayee(await getPayee(fresh.payeeId));
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

  async function connect() {
    setError(null);
    wallet.current ??= createStellarWalletsKitAdapter(publicConfig().networkPassphrase);
    try {
      setAddress(await wallet.current.connect());
    } catch {
      setError("pages.lock.errorTx");
    }
  }

  async function doRefund() {
    if (!wallet.current || !address) return;
    setError(null);
    setBusy(true);
    try {
      const { txHash } = await refund(lockId, walletSigner(wallet.current, address));
      setReceipt({ txHash, eventIndex: null });
      await load();
      setReceipt({ txHash, eventIndex: await findReceiptIndex(txHash, verifyReceipt, "Refunded") });
    } catch (e) {
      setError(refundErrorKey(e));
    } finally {
      setBusy(false);
    }
  }

  const config = publicConfig();
  return {
    phase,
    lock,
    payee,
    locale,
    now,
    address,
    isSender: lock !== null && address === lock.sender,
    eligibility: lock ? refundEligibility(lock, payee, now) : null,
    busy,
    error,
    receipt,
    usdc: {
      contractId: config.NEXT_PUBLIC_USDC_CONTRACT_ID,
      issuer: config.NEXT_PUBLIC_USDC_ISSUER,
    },
    connect,
    doRefund,
  };
}

export type LockPage = ReturnType<typeof useLockPage>;
