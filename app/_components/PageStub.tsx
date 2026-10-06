import { type MessageKey, t } from "@/lib/i18n/messages";

/** Placeholder used by scaffolded routes until each page is built. */
export function PageStub({ titleKey }: { titleKey: MessageKey }) {
  return (
    <main>
      <h1>{t(titleKey)}</h1>
      <p>{t("common.notImplemented")}</p>
    </main>
  );
}
