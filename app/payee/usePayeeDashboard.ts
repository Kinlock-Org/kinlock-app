/**
 * State for the payee dashboard (kept out of the .tsx so it holds markup only). Roadmap M3-11.
 * Locks are read from the indexer (list only, hard rule 3): this page lists and helps a payee
 * find a payment, nothing here moves money. Claiming happens on /claim/[id].
 */
import { useEffect, useRef, useState } from "react";
import type { MessageKey } from "@/lib/i18n/messages";
import { type IndexedLock, type IndexedPayee, type LOCK_STATES, listLocks } from "@/lib/indexer";
import { computeRefHash, parseClaimLink, publicConfig } from "@/lib/sdk";
import { createStellarWalletsKitAdapter, type WalletAdapter } from "@/lib/wallet";
import {
  byNewest,
  findByReference,
  matchingPayeeIds,
  type ReferenceFilterResult,
} from "./payee-logic";

type State = (typeof LOCK_STATES)[number];
type Phase = "connect" | "loading" | "readFailed" | "ready";

export function usePayeeDashboard(payees: IndexedPayee[]) {
  const wallet = useRef<WalletAdapter | null>(null);
  const [locale, setLocale] = useState("en");
  const [address, setAddress] = useState<string | null>(null);
  const [payeeIds, setPayeeIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("connect");
  const [locks, setLocks] = useState<IndexedLock[]>([]);
  const [stateFilter, setStateFilterValue] = useState<State | "">("");
  const [referenceLink, setReferenceLink] = useState("");
  const [referenceResult, setReferenceResult] = useState<ReferenceFilterResult>({ status: "none" });
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => setLocale(navigator.language), []);

  async function load(ids: string[], state?: State) {
    setPhase("loading");
    try {
      const pages = await Promise.all(ids.map((id) => listLocks(id, state)));
      setLocks(byNewest(pages.flat()));
      setPhase("ready");
    } catch {
      setPhase("readFailed");
    }
  }

  async function connect() {
    setError(null);
    wallet.current ??= createStellarWalletsKitAdapter(publicConfig().networkPassphrase);
    try {
      const addr = await wallet.current.connect();
      setAddress(addr);
      const ids = matchingPayeeIds(payees, addr);
      setPayeeIds(ids);
      await load(ids, stateFilter || undefined);
    } catch {
      setError("pages.payee.connectError");
    }
  }

  async function setStateFilter(next: State | "") {
    setStateFilterValue(next);
    setReferenceLink("");
    setReferenceResult({ status: "none" });
    await load(payeeIds, next || undefined);
  }

  async function checkReferenceLink(link: string) {
    setReferenceLink(link);
    setReferenceResult(await findByReference(link, locks, parseClaimLink, computeRefHash));
  }

  const clearReference = () => {
    setReferenceLink("");
    setReferenceResult({ status: "none" });
  };

  const visibleLocks =
    referenceResult.status === "found"
      ? locks.filter((l) => l.id === referenceResult.lockId)
      : locks;

  return {
    address,
    locale,
    phase,
    payeeIds,
    locks: visibleLocks,
    stateFilter,
    referenceLink,
    referenceResult,
    error,
    connect,
    setStateFilter,
    checkReferenceLink,
    clearReference,
  };
}
