/**
 * State for the send flow (kept out of the .tsx so it holds markup only). Roadmap M3-06.
 * Draft → wallet → preflight review → lock (wallet signs) → claim link saved in this browser.
 * The salt is generated here, in the browser, and goes only into the claim link's fragment.
 */
import type { PreflightResult } from "@kinlock/sdk";
import { useEffect, useRef, useState } from "react";
import type { ScheduleRow } from "@/app/request/schedule";
import { nextRow, todayUtc, unixSecondsOf } from "@/app/request/schedule";
import {
  browserStore,
  listPendingSubmissions,
  newClaimLink,
  removePendingSubmission,
  saveClaimLink,
  savePendingSubmission,
} from "@/lib/claim-links";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  computeRefHash,
  createLock,
  generateSalt,
  pollTransaction,
  preflight,
  publicConfig,
  toBaseUnits,
  walletSigner,
} from "@/lib/sdk";
import { createDefaultWalletAdapter, type WalletAdapter } from "@/lib/wallet";
import {
  confirmedLockId,
  defaultExpiryDate,
  draftProblem,
  prefillFrom,
  verdict,
} from "./send-logic";

type Stage = "edit" | "review" | "sending" | "pending" | "done";
const nowSeconds = () => BigInt(Math.floor(Date.now() / 1000));

export function useSendForm(payeeIds: string[], enableDirectPayments: boolean = false) {
  const wallet = useRef<WalletAdapter | null>(null);
  const [locale, setLocale] = useState("en");
  const directEnabled = enableDirectPayments;
  const [mode, setMode] = useState<"verified" | "direct">(
    directEnabled && payeeIds.length === 0 ? "direct" : "verified",
  );
  const [payeeId, setPayeeId] = useState(payeeIds[0] ?? "");
  const [recipient, setRecipient] = useState("");
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
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null);
  const [done, setDone] = useState<{ lockId: string; claimLink: string; saved: boolean } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  // Once per page load: locale, a fresh salt, and the request-link prefill. (Re-running this on
  // every render would overwrite the sender's edits and change the salt.)
  const initialized = useRef(false);
  const knownPayees = useRef(payeeIds);
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per page load (guarded by `initialized`); handlePendingConfirmation only uses its arguments and state setters
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setLocale(navigator.language);
    setSalt(generateSalt());
    // A send whose confirmation timed out before a reload or closed tab: resume tracking it, so
    // its claim link (reference and salt are only in this browser) can still be produced.
    const store = browserStore();
    const unresolved = store ? listPendingSubmissions(store).find((s) => s.txHash) : undefined;
    if (unresolved?.txHash) {
      setReferenceValue(unresolved.reference);
      setSalt(unresolved.salt);
      setPendingTxHash(unresolved.txHash);
      setPendingSubmissionId(unresolved.id);
      setStage("pending");
      setChecking(true);
      void handlePendingConfirmation(
        unresolved.txHash,
        unresolved.id,
        unresolved.reference,
        unresolved.salt,
      ).finally(() => setChecking(false));
      return;
    }
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
    wallet.current ??= await createDefaultWalletAdapter(publicConfig().networkPassphrase);
    try {
      setAddress(await wallet.current.connect());
    } catch {
      setError("pages.send.errorTx");
    }
  }

  const activeMode = directEnabled ? mode : "verified";
  const draft = () => ({ mode: activeMode, payeeId, recipient, reference, rows, expiryDate });
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
          ...(activeMode === "direct" ? { recipient } : { payeeId }),
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

  async function handlePendingConfirmation(hash: string, subId: string, ref: string, slt: string) {
    const store = browserStore();
    try {
      const res = await pollTransaction(hash);
      if (res.status === "SUCCESS") {
        // Never guess the id: a claim link to the wrong lock would point at someone else's
        // funds. Keep the pending record so the sender can check again later.
        const finalLockId = confirmedLockId(res);
        if (finalLockId === null) {
          setError("pages.send.pendingNoLockId");
          return;
        }
        const claimLink = newClaimLink(window.location.origin, finalLockId, ref, slt);
        const saved = store ? saveClaimLink(store, claimLink) : false;
        if (store) {
          removePendingSubmission(store, subId);
          removePendingSubmission(store, hash);
        }
        setDone({
          lockId: finalLockId.toString(),
          claimLink,
          saved,
        });
        setPendingTxHash(null);
        setPendingSubmissionId(null);
        setStage("done");
        window.dispatchEvent(new StorageEvent("storage"));
        return;
      }
      if (store) {
        removePendingSubmission(store, subId);
        removePendingSubmission(store, hash);
      }
      setPendingTxHash(null);
      setPendingSubmissionId(null);
      setError("pages.send.errorTx");
      setStage("review");
    } catch {
      setError("pages.send.pendingTimeout");
    }
  }

  async function checkPendingStatus() {
    if (!pendingTxHash) return;
    setError(null);
    setChecking(true);
    try {
      await handlePendingConfirmation(
        pendingTxHash,
        pendingSubmissionId ?? pendingTxHash,
        reference,
        salt,
      );
    } finally {
      setChecking(false);
    }
  }

  async function send() {
    if (!wallet.current || !address) return setError("pages.send.errorWallet");
    setError(null);
    setStage("sending");

    const submissionId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const store = browserStore();
    if (store) {
      savePendingSubmission(store, {
        id: submissionId,
        reference,
        salt,
        mode: activeMode,
        recipientOrPayee: activeMode === "direct" ? recipient : payeeId,
        createdAt: new Date().toISOString(),
      });
    }

    try {
      const { lockId, txHash } = await createLock(
        {
          sender: address,
          token: publicConfig().NEXT_PUBLIC_USDC_CONTRACT_ID,
          ...(activeMode === "direct" ? { recipient } : { payeeId }),
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
      const saved = store ? saveClaimLink(store, claimLink) : false;
      if (store) {
        removePendingSubmission(store, submissionId);
        if (txHash) removePendingSubmission(store, txHash);
      }
      setDone({
        lockId: lockId.toString(),
        claimLink,
        saved,
      });
      setStage("done");
      window.dispatchEvent(new StorageEvent("storage"));
    } catch (e) {
      const err = e as { code?: string; txHash?: string };
      if (err.code === "TX_PENDING" && err.txHash) {
        const hash = err.txHash;
        if (store) {
          savePendingSubmission(store, {
            id: submissionId,
            reference,
            salt,
            mode: activeMode,
            recipientOrPayee: activeMode === "direct" ? recipient : payeeId,
            txHash: hash,
            createdAt: new Date().toISOString(),
          });
        }
        setPendingTxHash(hash);
        setPendingSubmissionId(submissionId);
        setStage("pending");
        await handlePendingConfirmation(hash, submissionId, reference, salt);
        return;
      }

      if (store) {
        removePendingSubmission(store, submissionId);
      }
      const code = err.code;
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
    setPendingTxHash(null);
    setPendingSubmissionId(null);
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
    mode: activeMode,
    directEnabled,
    setMode: (m: "verified" | "direct") => {
      if (!directEnabled && m === "direct") return;
      setMode(m);
      backToEdit();
    },
    payeeId,
    setPayeeId: (id: string) => {
      setPayeeId(id);
      setUnknownPayee(false);
      backToEdit();
    },
    recipient,
    setRecipient: (r: string) => {
      setRecipient(r);
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
    pendingTxHash,
    checkPendingStatus,
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
