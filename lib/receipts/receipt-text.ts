/** Message keys for a verification result, shared by `/r/[txHash]/[eventIndex]` and `/verify`. */
import type { ReceiptKind, VerifyReceiptReason } from "@kinlock/sdk";
import type { MessageKey } from "@/lib/i18n/messages";

export const kindMessageKey = (kind: ReceiptKind): MessageKey => `receipt.kind.${kind}`;

/** `null` for "verified": the headline ("Payment to verified payee") speaks for itself then. */
export function reasonMessageKey(reason: VerifyReceiptReason): MessageKey | null {
  if (reason === "verified") return null;
  return `receipt.reason.${reason}`;
}
