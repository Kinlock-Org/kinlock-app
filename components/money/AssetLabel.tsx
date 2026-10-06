import { shortAddress } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/messages";

/**
 * Always shows the asset code AND its issuer, never the code alone, so look-alike assets can't
 * pass for USDC (AGENTS.md §8.3). The full issuer is in the title and for screen readers.
 */
export function AssetLabel({ code, issuer }: { code: string; issuer: string }) {
  return (
    <span className="asset">
      <span className="asset-code">{code}</span>{" "}
      <small title={issuer}>
        {t("money.issuer")} <span aria-hidden="true">{shortAddress(issuer)}</span>
        <span className="sr-only">{issuer}</span>
      </small>
    </span>
  );
}
