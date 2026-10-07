/** Payee creates a payment-request link. Roadmap M3-05. */
import { type MessageKey, t } from "@/lib/i18n/messages";
import { type IndexedPayee, listPayees, payable } from "@/lib/indexer";
import { RequestForm } from "./RequestForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  let payees: IndexedPayee[] | null = null;
  try {
    payees = payable(await listPayees());
  } catch {
    payees = null;
  }
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-semibold">{t("pages.request.title")}</h1>
      <p className="mt-2">{t("pages.request.intro")}</p>
      <p className="mt-2 text-sm">{t("pages.request.noAuthority")}</p>
      <Body payees={payees} />
    </main>
  );
}

function Body({ payees }: { payees: IndexedPayee[] | null }) {
  const notice: MessageKey | null =
    payees === null
      ? "pages.request.indexerDown"
      : payees.length === 0
        ? "pages.request.payeeNone"
        : null;
  const options = (payees ?? []).map((p) => ({
    payeeId: p.payeeId,
    label: [p.displayName, p.city, p.country].filter(Boolean).join(" · "),
  }));
  return notice ? (
    <p role={payees === null ? "alert" : undefined} className="mt-4">
      {t(notice)}
    </p>
  ) : (
    <RequestForm payees={options} />
  );
}
