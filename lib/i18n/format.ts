/**
 * Locale-aware display formatting with Intl only. Never hard-code a locale or currency:
 * the currency comes from the payee's registry `local_currency`, the locale from the viewer.
 * Token amounts are converted to decimal strings by the SDK's format helpers first.
 * Roadmap M3-15, M3-23.
 */
export function formatCurrency(_decimalAmount: string, _currency: string, _locale: string): string {
  throw new Error("formatCurrency is not implemented yet (M3-23)");
}

/** Shows both UTC and the viewer's local time (hard requirement). */
export function formatDateTimeUtcAndLocal(_unixSeconds: bigint, _locale: string): { utc: string; local: string } {
  throw new Error("formatDateTimeUtcAndLocal is not implemented yet (M3-15)");
}
