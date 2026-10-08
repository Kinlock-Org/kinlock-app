/** Zod-validated public config. Roadmap M3-03. No country, currency, or anchor values here. */
import { z } from "zod";

/** Network passphrases. Mainnet is refused until it is explicitly approved (AGENTS.md §2). */
export const NETWORK_PASSPHRASES = {
  local: "Standalone Network ; February 2017",
  testnet: "Test SDF Network ; September 2015",
} as const;

const PublicConfigSchema = z.object({
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(["local", "testnet"]),
  /** Comma-separated; the first is used, the rest are for future failover. */
  NEXT_PUBLIC_RPC_URLS: z
    .string()
    .min(1)
    .transform((s) =>
      s
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1)),
  NEXT_PUBLIC_CONTRACT_ID: z.string().regex(/^C[A-Z2-7]{55}$/),
  /**
   * List API: lists, dashboards, preflight warnings, receipt lookups. Never money pages.
   * Optional (matches the SDK's own `KinlockConfig.indexerUrl?: string`): until an indexer is
   * deployed (M2-18), chain-only features (verify, lock reads, release/refund/decline) must keep
   * working; only indexer-backed lists and preflight checks degrade, each with its own message.
   */
  NEXT_PUBLIC_INDEXER_URL: z.url().optional(),
  /** The USDC token contract (Stellar Asset Contract) passed to `createLock`. */
  NEXT_PUBLIC_USDC_CONTRACT_ID: z.string().regex(/^C[A-Z2-7]{55}$/),
  /** USDC issuer, shown with the asset code everywhere (AssetLabel). */
  NEXT_PUBLIC_USDC_ISSUER: z.string().regex(/^G[A-Z2-7]{55}$/),
});

export type PublicConfig = z.infer<typeof PublicConfigSchema> & { networkPassphrase: string };

/** `env` defaults to the inlined NEXT_PUBLIC_* values (each must be named for Next to inline it). */
export function loadPublicConfig(
  env: Record<string, string | undefined> = {
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
    NEXT_PUBLIC_RPC_URLS: process.env.NEXT_PUBLIC_RPC_URLS,
    NEXT_PUBLIC_CONTRACT_ID: process.env.NEXT_PUBLIC_CONTRACT_ID,
    NEXT_PUBLIC_INDEXER_URL: process.env.NEXT_PUBLIC_INDEXER_URL,
    NEXT_PUBLIC_USDC_CONTRACT_ID: process.env.NEXT_PUBLIC_USDC_CONTRACT_ID,
    NEXT_PUBLIC_USDC_ISSUER: process.env.NEXT_PUBLIC_USDC_ISSUER,
  },
): PublicConfig {
  const parsed = PublicConfigSchema.parse(env);
  return { ...parsed, networkPassphrase: NETWORK_PASSPHRASES[parsed.NEXT_PUBLIC_STELLAR_NETWORK] };
}
