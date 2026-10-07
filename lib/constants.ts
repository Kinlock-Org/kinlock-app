/** App-wide constants. Contract limits mirror kinlock-contracts `constants.rs`; keep them in sync. */

/** Most tranches a lock can have (contract `MAX_TRANCHES`). */
export const MAX_TRANCHES = 12;

/** The token every lock uses today (USDC); the issuer comes from config. */
export const ASSET_CODE = "USDC";

/** A payee Suspended this long lets senders refund (contract `SUSPENSION_REFUND_GRACE_SECS`). */
export const SUSPENSION_REFUND_GRACE_SECS = 14n * 24n * 60n * 60n;

/** Smallest lock total (contract `MIN_AMOUNT`): 1 USDC in base units. */
export const MIN_LOCK_TOTAL = 10_000_000n;

/** Expiry must be at least this far ahead (contract `MIN_EXPIRY_AHEAD_SECS`). */
export const MIN_EXPIRY_AHEAD_SECS = 60n * 60n;

/** Longest lock (contract `MAX_LOCK_DURATION_SECS`): 149 days. */
export const MAX_LOCK_DURATION_SECS = 149n * 24n * 60n * 60n;

/** Default time between the last payment and expiry, so the payee has time to claim. */
export const DEFAULT_CLAIM_WINDOW_SECS = 30n * 24n * 60n * 60n;
