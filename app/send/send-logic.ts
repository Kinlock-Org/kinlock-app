/** Pure logic for the send flow (kept out of the .tsx for testing). Roadmap M3-06. */
import type { PreflightResult } from "@kinlock/sdk";
import { type ScheduleRow, unixSecondsOf } from "@/app/request/schedule";
import {
  DEFAULT_CLAIM_WINDOW_SECS,
  MAX_LOCK_DURATION_SECS,
  MIN_EXPIRY_AHEAD_SECS,
  MIN_LOCK_TOTAL,
} from "@/lib/constants";
import type { MessageKey } from "@/lib/i18n/messages";
import { parseRequestLink, toBaseUnits } from "@/lib/sdk";

/** Margin over the contract minimum, so a slow wallet signature doesn't push expiry too close. */
const EXPIRY_MARGIN_SECS = 10n * 60n;

export const dateOf = (unixSeconds: bigint): string =>
  new Date(Number(unixSeconds) * 1000).toISOString().slice(0, 10);

/** Default expiry: 30 days after the last payment, kept inside the contract's window. */
export function defaultExpiryDate(rows: ScheduleRow[], now: bigint): string {
  const last = rows.reduce((max, r) => {
    const at = r.date ? unixSecondsOf(r.date) : 0n;
    return at > max ? at : max;
  }, now);
  const latest = now + MAX_LOCK_DURATION_SECS - 24n * 60n * 60n;
  const wanted = last + DEFAULT_CLAIM_WINDOW_SECS;
  return dateOf(wanted < latest ? wanted : latest);
}

export interface Draft {
  payeeId: string;
  reference: string;
  rows: ScheduleRow[];
  expiryDate: string;
}

/** The first problem with the draft, as a message key, or null. Mirrors the contract's checks. */
export function draftProblem(d: Draft, now: bigint): MessageKey | null {
  if (!d.payeeId) return "pages.send.errorPayee";
  if (!d.reference.trim()) return "pages.send.errorReference";
  if (d.rows.some((r) => !r.date) || !d.expiryDate) return "pages.send.errorDate";
  let total = 0n;
  try {
    for (const r of d.rows) {
      const amount = toBaseUnits(r.amount.trim());
      if (amount <= 0n) return "pages.send.errorAmount";
      total += amount;
    }
  } catch {
    return "pages.send.errorAmount";
  }
  if (total < MIN_LOCK_TOTAL) return "pages.send.errorMinimum";
  const unlocks = d.rows.map((r) => unixSecondsOf(r.date));
  if (unlocks.some((at, i) => i !== 0 && (unlocks[i - 1] ?? at) > at))
    return "pages.send.errorOrder";
  const expiresAt = unixSecondsOf(d.expiryDate);
  if (unlocks.some((at) => at > expiresAt)) return "pages.send.errorUnlockAfterExpiry";
  if (expiresAt < now + MIN_EXPIRY_AHEAD_SECS + EXPIRY_MARGIN_SECS)
    return "pages.send.errorExpirySoon";
  if (expiresAt > now + MAX_LOCK_DURATION_SECS) return "pages.send.errorExpiryFar";
  return null;
}

/** Form values from a payment-request link (`/send?payee=…&ref=…&schedule=…`), or null. */
export function prefillFrom(href: string): Pick<Draft, "payeeId" | "reference" | "rows"> | null {
  if (!new URL(href).searchParams.has("payee")) return null;
  try {
    const parts = parseRequestLink(href);
    return {
      payeeId: parts.payeeId,
      reference: parts.reference,
      rows: parts.schedule.map((s, key) => ({ key, amount: s.amount, date: dateOf(s.unlockAt) })),
    };
  } catch {
    return null;
  }
}

export type PreflightVerdict = "blocked" | "needsAcknowledgement" | "ok";

/** A failed blocking check stops the send; a failed warning needs the sender's acknowledgement. */
export function verdict(results: PreflightResult[]): PreflightVerdict {
  if (results.some((r) => r.severity === "block" && r.status === "fail")) return "blocked";
  if (results.some((r) => r.severity === "warn" && r.status === "fail"))
    return "needsAcknowledgement";
  return "ok";
}

/** The message key for a preflight result: the SDK's key when the app has text for it. */
export function preflightKey(
  result: PreflightResult,
  hasKey: (key: string) => boolean,
): MessageKey {
  const key = result.messageKey;
  if (hasKey(key)) return key as MessageKey;
  return `preflight.${result.check}.${result.status === "pass" ? "pass" : "unknown"}` as MessageKey;
}

/** The payee's ISO 4217 currency from registry data (display only), if known. */
export function localCurrencyOf(
  payees: { payeeId: string; localCurrency: string | null }[],
  payeeId: string,
): string | undefined {
  return payees.find((p) => p.payeeId === payeeId)?.localCurrency ?? undefined;
}

export const idsOf = (payees: { payeeId: string }[]): string[] => payees.map((p) => p.payeeId);
