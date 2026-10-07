/** Message keys and error mapping for the lock page (kept out of the .tsx). Roadmap M3-08. */
import type { MessageKey } from "@/lib/i18n/messages";

export function refundErrorKey(error: unknown): MessageKey {
  const e = error as { code?: string; contractError?: string } | null;
  if (e?.code === "CONTRACT_ERROR") {
    if (e.contractError === "RefundNotAllowed") return "pages.lock.errorNotAllowed";
    if (e.contractError === "LockNotOpen") return "pages.lock.errorClosed";
    return "pages.lock.errorGeneric";
  }
  if (e?.code === "TX_FAILED") return "pages.lock.errorTx";
  return "pages.lock.errorGeneric";
}
