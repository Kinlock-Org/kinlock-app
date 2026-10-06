/**
 * Locale-aware display formatting with Intl only (roadmap M3-15, M3-23). Never hard-code a
 * locale or currency: the currency comes from the payee's registry `local_currency`, the locale
 * from the viewer. Amounts arrive as exact decimal strings from the SDK's `fromBaseUnits` and are
 * formatted as strings, never converted to floating-point numbers.
 */

/** A token amount, e.g. "1250.5" → "1,250.5" (en) or "1.250,5" (de). Keeps every decimal. */
export function formatTokenAmount(decimal: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  }).format(decimal as unknown as number);
}

/**
 * An indicative local-currency amount, using the currency's own number of decimals
 * (0 for JPY, 3 for KWD). Only for display next to the USD amount, never for money logic.
 */
export function formatLocalCurrency(decimal: string, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    decimal as unknown as number,
  );
}

/** The same instant in UTC and in the viewer's time zone (both are always shown). */
export function formatDateTimeUtcAndLocal(
  unixSeconds: bigint,
  locale: string,
  timeZone?: string,
): { utc: string; local: string } {
  const date = new Date(Number(unixSeconds) * 1000);
  // dateStyle/timeStyle can't be combined with timeZoneName, so the parts are named explicitly.
  const style = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  } as const;
  return {
    utc: new Intl.DateTimeFormat(locale, { ...style, timeZone: "UTC" }).format(date),
    local: new Intl.DateTimeFormat(locale, { ...style, timeZone }).format(date),
  };
}

/** A long Stellar address shortened for display, e.g. GBBD47…FLA5. The full value stays available. */
export const shortAddress = (address: string): string =>
  address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
