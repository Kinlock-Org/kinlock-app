/**
 * Indicative local-currency rates. DISPLAY ONLY: never used in money logic.
 * Provider choice pending (DEC-10, M3-16). If no reliable rate exists, return null and the
 * UI shows USD only with a note. Never invent or hard-code a rate.
 */
export interface IndicativeRate {
  /** ISO 4217 */
  currency: string;
  /** Local-currency units per 1 USD, as a decimal string. */
  perUsd: string;
  asOf: Date;
  source: string;
}

export interface RateProvider {
  getRate(currency: string): Promise<IndicativeRate | null>;
}
