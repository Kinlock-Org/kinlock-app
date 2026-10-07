/**
 * State for the send flow (kept out of the .tsx so it holds markup only). Roadmap M3-06.
 * Draft → wallet → preflight review → lock (wallet signs) → claim link saved in this browser.
 * The salt is generated here, in the browser, and goes only into the claim link's fragment.
 */
import type { PreflightResult } from "@kinlock/sdk";
import { useEffect, useRef, useState } from "react";
import type { ScheduleRow } from "@/app/request/schedule";
import { nextRow, todayUtc, unixSecondsOf } from "@/app/request/schedule";
import { browserStore, newClaimLink, saveClaimLink } from "@/lib/claim-links";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  computeRefHash,
  createLock,
  generateSalt,
  preflight,
  publicConfig,
  toBaseUnits,
  walletSigner,
} from "@/lib/sdk";
import { createStellarWalletsKitAdapter, type WalletAdapter } from "@/lib/wallet";
import { defaultExpiryDate, draftProblem, prefillFrom, verdict } from "./send-logic";

type Stage = "edit" | "review" | "sending" | "done";
const nowSeconds = () => BigInt(Math.floor(Date.now() / 1000));

export function useSendForm(payeeIds: string[]) {
  const wallet = useRef<WalletAdapter | null>(null);
  const [locale, setLocale] = useState("en");
  const [payeeId, setPayeeId] = useState(payeeIds[0] ?? "");
  const [reference, setReferenceValue] = useState("");
  const [rows, setRows] = useState<ScheduleRow[]>([{ key: 0, amount: "", date: todayUtc() }]);
  const [expiryDate, setExpiryDate] = useState(() => defaultExpiryDate([], nowSeconds()));
  const [prefilled, setPrefilled] = useState(false);
  const [unknownPayee, setUnknownPayee] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("edit");
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<PreflightResult[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const [salt, setSalt] = useState("");
  const [done, setDone] = useState<{ lockId: string; claimLink: string; saved: boolean } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  // Once per page load: locale, a fresh salt, and the request-link prefill. (Re-running this on
  // every render would overwrite the sender's edits and change the salt.)
  const initialized = useRef(false);
  const knownPayees = useRef(payeeIds);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setLocale(navigator.language);
    setSalt(generateSalt());
    const fill = prefillFrom(window.location.href);
    if (fill) {
      setPrefilled(true);
      setPayeeId(fill.payeeId);
      setUnknownPayee(!knownPayees.current.includes(fill.payeeId));
      setReferenceValue(fill.reference);
      setRows(fill.rows);
      setExpiryDate(defaultExpiryDate(fill.rows, nowSeconds()));
    }
  }, []);

  const backToEdit = () => {
    setStage("edit");
    setResults([]);
    setAcknowledged(false);
  };
  const setReference = (value: string) => {
    setReferenceValue(value);
    backToEdit();
  };
  const updateRow = (key: number, patch: Partial<ScheduleRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    backToEdit();
  };

  async function connect() {
    setError(null);
    wallet.current ??= createStellarWalletsKitAdapter(publicConfig().networkPassphrase);
    try {
      setAddress(await wallet.current.connect());
    } catch {
      setError("pages.send.errorTx");
    }
  }

  const draft = () => ({ payeeId, reference, rows, expiryDate });
  const total = () => rows.reduce((sum, r) => sum + toBaseUnits(r.amount.trim()), 0n);

  async function review() {
    setError(null);
    const problem = draftProblem(draft(), nowSeconds());
    if (problem) return setError(problem);
    if (!address) return setError("pages.send.errorWallet");
    setChecking(true);
    try {
      const refHash = await computeRefHash(reference, salt);
      setResults(
        await preflight({
          sender: address,
          token: publicConfig().NEXT_PUBLIC_USDC_CONTRACT_ID,
          payeeId,
          total: total(),
          refHash,
        }),
      );
      setAcknowledged(false);
      setStage("review");
    } catch {
      setError("pages.send.errorGeneric");
    } finally {
      setChecking(false);
    }
  }

  async function send() {
    if (!wallet.current || !address) return setError("pages.send.errorWallet");
    setError(null);
    setStage("sending");
    try {
      const { lockId } = await createLock(
        {
          sender: address,
          token: publicConfig().NEXT_PUBLIC_USDC_CONTRACT_ID,
          payeeId,
          tranches: rows.map((r) => ({
            amount: toBaseUnits(r.amount.trim()),
            unlockAt: unixSecondsOf(r.date),
          })),
          refHash: await computeRefHash(reference, salt),
          expiresAt: unixSecondsOf(expiryDate),
        },
        walletSigner(wallet.current, address),
      );
      const claimLink = newClaimLink(window.location.origin, lockId, reference, salt);
      const store = browserStore();
      setDone({
        lockId: lockId.toString(),
        claimLink,
        saved: store ? saveClaimLink(store, claimLink) : false,
      });
      setStage("done");
      window.dispatchEvent(new StorageEvent("storage"));
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(
        code === "TX_FAILED"
          ? "pages.send.errorTx"
          : code === "CONTRACT_ERROR"
            ? "pages.send.errorContract"
            : "pages.send.errorGeneric",
      );
      setStage("review");
    }
  }

  async function copy() {
    if (!done) return;
    await navigator.clipboard.writeText(done.claimLink);
    setCopied(true);
  }

  function reset() {
    setDone(null);
    setCopied(false);
    setSalt(generateSalt());
    setReferenceValue("");
    setRows([{ key: 0, amount: "", date: todayUtc() }]);
    backToEdit();
  }

  const v = verdict(results);
  let totalBase: bigint | null;
  try {
    totalBase = total();
  } catch {
    totalBase = null;
  }
  return {
    locale,
    payeeId,
    setPayeeId: (id: string) => {
      setPayeeId(id);
      setUnknownPayee(false);
      backToEdit();
    },
    reference,
    setReference,
    rows,
    updateRow,
    addRow: () => setRows((rs) => [...rs, nextRow(rs)]),
    removeRow: (key: number) => setRows((rs) => rs.filter((r) => r.key !== key)),
    expiryDate,
    setExpiryDate: (d: string) => {
      setExpiryDate(d);
      backToEdit();
    },
    totalBase,
    prefilled,
    unknownPayee,
    address,
    connect,
    stage,
    checking,
    results,
    verdict: v,
    acknowledged,
    setAcknowledged,
    canSend: stage === "review" && (v === "ok" || (v === "needsAcknowledgement" && acknowledged)),
    review,
    send,
    backToEdit,
    error,
    done,
    copied,
    copy,
    reset,
  };
}

export type SendForm = ReturnType<typeof useSendForm>;
