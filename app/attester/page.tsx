/** Attester read-only account checks. Roadmap M3-12. */
import { t } from "@/lib/i18n/messages";
import { publicConfig } from "@/lib/sdk";
import { AttesterChecker } from "./AttesterChecker";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Attester Checks — Kinlock",
};

export default function Page() {
  let usdcIssuer = "";
  let network = "testnet";
  try {
    const cfg = publicConfig();
    usdcIssuer = cfg.NEXT_PUBLIC_USDC_ISSUER;
    network = cfg.NEXT_PUBLIC_STELLAR_NETWORK;
  } catch {
    // Graceful fallback during static page analysis if env vars are unpopulated
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("pages.attester.title")}</h1>
        <p className="text-sm text-muted">{t("pages.attester.subtitle")}</p>
      </div>

      <AttesterChecker usdcIssuer={usdcIssuer} network={network} />
    </div>
  );
}
