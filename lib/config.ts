/** Zod-validated public config. Roadmap M3-03. No country, currency, or anchor values here. */
import { z } from "zod";

const PublicConfigSchema = z.object({
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(["local", "testnet", "mainnet"]),
  NEXT_PUBLIC_RPC_URLS: z.string().min(1),
  NEXT_PUBLIC_CONTRACT_ID: z.string().regex(/^C[A-Z2-7]{55}$/),
  NEXT_PUBLIC_INDEXER_URL: z.string().min(1),
  NEXT_PUBLIC_USDC_ISSUER: z.string().regex(/^G[A-Z2-7]{55}$/),
});

export type PublicConfig = z.infer<typeof PublicConfigSchema>;

export function loadPublicConfig(): PublicConfig {
  return PublicConfigSchema.parse({
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
    NEXT_PUBLIC_RPC_URLS: process.env.NEXT_PUBLIC_RPC_URLS,
    NEXT_PUBLIC_CONTRACT_ID: process.env.NEXT_PUBLIC_CONTRACT_ID,
    NEXT_PUBLIC_INDEXER_URL: process.env.NEXT_PUBLIC_INDEXER_URL,
    NEXT_PUBLIC_USDC_ISSUER: process.env.NEXT_PUBLIC_USDC_ISSUER,
  });
}
