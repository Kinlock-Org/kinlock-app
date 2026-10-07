/** App-wide constants. Contract limits mirror kinlock-contracts `constants.rs`; keep them in sync. */

/** Most tranches a lock can have (contract `MAX_TRANCHES`). */
export const MAX_TRANCHES = 12;

/** The token every lock uses today (USDC); the issuer comes from config. */
export const ASSET_CODE = "USDC";

/** A payee Suspended this long lets senders refund (contract `SUSPENSION_REFUND_GRACE_SECS`). */
export const SUSPENSION_REFUND_GRACE_SECS = 14n * 24n * 60n * 60n;
