/** State for the saved-claim-links list (kept out of the .tsx so it holds markup only). */
import { useCallback, useEffect, useState } from "react";
import {
  browserStore,
  exportClaimLinks,
  listClaimLinks,
  removeClaimLink,
  type SavedClaimLink,
} from "@/lib/claim-links";
import { t } from "@/lib/i18n/messages";

export function useSavedClaimLinks() {
  const [available, setAvailable] = useState(true);
  const [links, setLinks] = useState<SavedClaimLink[]>([]);
  const [copiedLockId, setCopiedLockId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const store = browserStore();
    setAvailable(store !== null);
    setLinks(store ? listClaimLinks(store) : []);
  }, []);

  useEffect(() => {
    refresh();
    // Another tab saving a link updates this list too.
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [refresh]);

  async function copy(link: SavedClaimLink) {
    await navigator.clipboard.writeText(link.url);
    setCopiedLockId(link.lockId);
  }

  function remove(lockId: string) {
    const store = browserStore();
    if (!store || !window.confirm(t("claimLinks.confirmRemove"))) return;
    removeClaimLink(store, lockId);
    refresh();
  }

  /** Downloads the file locally (a blob URL); nothing is uploaded. */
  function exportAll() {
    const store = browserStore();
    if (!store) return;
    const url = URL.createObjectURL(
      new Blob([exportClaimLinks(store)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `kinlock-claim-links-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { available, links, copiedLockId, copy, remove, exportAll };
}
