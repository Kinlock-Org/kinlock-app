/** Sender flow: request-link prefill, preflight, USD (indicative local currency once DEC-10). Roadmap M3-06. */
import { SavedClaimLinks } from "@/components/claim-links/SavedClaimLinks";
import { LagNotice } from "@/components/indexer/LagNotice";
import { t } from "@/lib/i18n/messages";
import { type IndexedPayee, indexerLagging, listPayees, payable } from "@/lib/indexer";
import { publicConfig } from "@/lib/sdk";
import { SendForm } from "./SendForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  let payees: IndexedPayee[] | null = null;
  let lagging = false;
  try {
    [payees, lagging] = await Promise.all([listPayees().then(payable), indexerLagging()]);
  } catch {
    payees = null;
  }
  return (
    <main className="mx-auto max-w-xl p-4">
      <h1 className="text-2xl font-semibold">{t("pages.send.title")}</h1>
      <p className="mt-2">{t("pages.send.intro")}</p>
      {payees !== null ? <LagNotice lagging={lagging} /> : null}
      <Body payees={payees} />
      <SavedClaimLinks />
    </main>
  );
}

function Body({ payees }: { payees: IndexedPayee[] | null }) {
  const options = (payees ?? []).map((p) => ({
    payeeId: p.payeeId,
    label: [p.displayName, p.city, p.country].filter(Boolean).join(" · "),
    localCurrency: p.localCurrency,
  }));
  return (
    <div>
      {payees === null ? (
        <p role="alert" className="mt-2 text-sm text-gray-600">
          {t("pages.send.indexerDown")}
        </p>
      ) : null}
      <SendForm payees={options} issuer={publicConfig().NEXT_PUBLIC_USDC_ISSUER} />
    </div>
  );
}
