/** Message keys for the claim page's states (kept out of the .tsx so it holds markup only). */
import type { MessageKey } from "@/lib/i18n/messages";
import type { ReferenceCheck, TrancheStatus } from "./claim-logic";

export function phaseMessage(
  phase: "loading" | "notFound" | "readFailed" | "ready",
): MessageKey | null {
  if (phase === "loading") return "pages.claim.loading";
  if (phase === "notFound") return "pages.claim.notFound";
  if (phase === "readFailed") return "pages.claim.readFailed";
  return null;
}

export function referenceMessage(status: ReferenceCheck["status"]): MessageKey {
  if (status === "match") return "pages.claim.referenceMatch";
  if (status === "mismatch") return "pages.claim.referenceMismatch";
  return "pages.claim.referenceMissing";
}

export const statusMessage = (status: TrancheStatus): MessageKey => `pages.claim.status.${status}`;
