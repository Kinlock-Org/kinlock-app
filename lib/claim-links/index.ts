/**
 * [sec] Browser-only storage and export of the sender's claim links. Roadmap M3-07.
 * Claim links contain the reference and salt: they must NEVER be sent to a server,
 * logged, or passed to third-party scripts.
 */
export interface SavedClaimLink {
  lockId: string;
  url: string;
  savedAt: string;
}
