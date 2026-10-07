/** Pure helpers for the request form's schedule (kept out of the .tsx for testing). */
import { fromBaseUnits, toBaseUnits } from "@/lib/sdk";

export interface ScheduleRow {
  key: number;
  amount: string;
  /** YYYY-MM-DD, read as midnight UTC. */
  date: string;
}

export const todayUtc = (): string => new Date().toISOString().slice(0, 10);

export const unixSecondsOf = (date: string): bigint =>
  BigInt(Date.parse(`${date}T00:00:00Z`) / 1000);

/** Sum of the rows as a decimal string, or null while any amount is not a valid amount. */
export function totalOf(rows: ScheduleRow[]): string | null {
  try {
    return fromBaseUnits(rows.reduce((sum, r) => sum + toBaseUnits(r.amount.trim()), 0n));
  } catch {
    return null;
  }
}

/** True when unlock dates go backwards (the contract requires non-decreasing dates). */
export function outOfOrder(unlockAts: bigint[]): boolean {
  return unlockAts.some((at, i) => i !== 0 && (unlockAts[i - 1] ?? at) > at);
}

export const nextRow = (rows: ScheduleRow[]): ScheduleRow => ({
  key: Math.max(-1, ...rows.map((r) => r.key)) + 1,
  amount: "",
  date: rows.at(-1)?.date ?? todayUtc(),
});
