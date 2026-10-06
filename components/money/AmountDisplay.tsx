import { formatTokenAmount } from "@/lib/i18n/format";
import { AssetLabel } from "./AssetLabel";
import { RateNotice } from "./RateNotice";

/**
 * A token amount with its asset (code and issuer). When the payee has a local currency, a
 * rate-risk note is shown; the indicative local amount appears only once a rate source exists
 * (DEC-10) — until then the app shows USD only, as the rules allow. Roadmap M3-15, M3-06.
 */
export function AmountDisplay(props: {
  /** Exact decimal string from the SDK's fromBaseUnits. */
  decimal: string;
  assetCode: string;
  issuer: string;
  locale: string;
  /** The payee's ISO 4217 currency from registry data, if any. */
  localCurrency?: string;
}) {
  return (
    <span className="amount">
      <span className="amount-value">{formatTokenAmount(props.decimal, props.locale)}</span>{" "}
      <AssetLabel code={props.assetCode} issuer={props.issuer} />
      {props.localCurrency ? <RateNotice hasRate={false} /> : null}
    </span>
  );
}
