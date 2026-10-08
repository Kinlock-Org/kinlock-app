/**
 * Pure parsing/validation for receipt references, shared by `/r/[txHash]/[eventIndex]` and
 * `/verify` (kept out of the view files for testing). Mirrors the SDK's own `checkRef` shape
 * (`@kinlock/sdk` `receipts.ts`): txHash is 32 bytes as lowercase hex, eventIndex a non-negative
 * integer.
 */

const TX_HASH = /^[0-9a-f]{64}$/;
const EVENT_INDEX = /^\d+$/;
/** `/r/{txHash}/{eventIndex}`, with or without an origin in front. */
const RECEIPT_PATH = /\/r\/([0-9a-f]{64})\/(\d+)\/?$/;

export function isValidTxHash(value: string): boolean {
  return TX_HASH.test(value);
}

export function isValidEventIndex(value: string): boolean {
  return EVENT_INDEX.test(value);
}

export type VerifyInput =
  | { ok: true; txHash: string; eventIndex: number }
  | { ok: false; error: "input" | "eventIndex" };

/**
 * Accepts either a full receipt link/path (`.../r/{txHash}/{eventIndex}`) or a bare transaction
 * hash paired with a separately-entered event number.
 */
export function parseVerifyInput(linkOrHash: string, eventIndexField: string): VerifyInput {
  const trimmed = linkOrHash.trim();
  const fromPath = RECEIPT_PATH.exec(trimmed);
  if (fromPath?.[1] && fromPath[2]) {
    return { ok: true, txHash: fromPath[1], eventIndex: Number(fromPath[2]) };
  }
  if (!isValidTxHash(trimmed)) return { ok: false, error: "input" };
  const index = eventIndexField.trim();
  if (!isValidEventIndex(index)) return { ok: false, error: "eventIndex" };
  return { ok: true, txHash: trimmed, eventIndex: Number(index) };
}
