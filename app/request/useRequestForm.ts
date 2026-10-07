/** State and actions for the request form (kept out of the .tsx so it holds markup only). */
import { useEffect, useState } from "react";
import type { MessageKey } from "@/lib/i18n/messages";
import { buildRequestLink, KinlockError } from "@/lib/sdk";
import {
  nextRow,
  outOfOrder,
  type ScheduleRow,
  todayUtc,
  totalOf,
  unixSecondsOf,
} from "./schedule";

export function useRequestForm(firstPayeeId: string) {
  const [locale, setLocale] = useState("en");
  const [payeeId, setPayeeId] = useState(firstPayeeId);
  const [reference, setReferenceValue] = useState("");
  const [rows, setRows] = useState<ScheduleRow[]>([{ key: 0, amount: "", date: todayUtc() }]);
  const [error, setError] = useState<MessageKey | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setLocale(navigator.language), []);

  const setReference = (value: string) => {
    setReferenceValue(value);
    setLink(null);
  };
  const updateRow = (key: number, patch: Partial<ScheduleRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setLink(null);
  };
  const addRow = () => setRows((rs) => [...rs, nextRow(rs)]);
  const removeRow = (key: number) => setRows((rs) => rs.filter((r) => r.key !== key));

  /** Builds the link in the browser; nothing is sent anywhere. */
  function create(event: { preventDefault(): void }) {
    event.preventDefault();
    setError(null);
    setLink(null);
    setCopied(false);
    if (!reference.trim()) return setError("pages.request.errorReference");
    if (rows.some((r) => !r.date)) return setError("pages.request.errorDate");
    const schedule = rows.map((r) => ({
      amount: r.amount.trim(),
      unlockAt: unixSecondsOf(r.date),
    }));
    if (outOfOrder(schedule.map((s) => s.unlockAt))) return setError("pages.request.errorOrder");
    try {
      setLink(buildRequestLink(window.location.origin, { payeeId, reference, schedule }));
    } catch (e) {
      const code = e instanceof KinlockError ? e.code : null;
      setError(
        code === "INVALID_AMOUNT"
          ? "pages.request.errorAmount"
          : code === "INVALID_REFERENCE"
            ? "pages.request.errorReference"
            : "pages.request.errorGeneric",
      );
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  return {
    locale,
    payeeId,
    setPayeeId,
    reference,
    setReference,
    rows,
    updateRow,
    addRow,
    removeRow,
    total: totalOf(rows),
    error,
    link,
    copied,
    create,
    copy,
  };
}
