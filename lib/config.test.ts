import { describe, expect, it } from "vitest";
import { loadPublicConfig, NETWORK_PASSPHRASES } from "./config";

const env = {
  NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
  NEXT_PUBLIC_RPC_URLS: "https://rpc-a.example, https://rpc-b.example",
  NEXT_PUBLIC_CONTRACT_ID: "CCSHDQFRYFC3AHV5NE6ULQW6X2CMG5RPANBORDXJGSUD6UKECASJQBRI",
  NEXT_PUBLIC_INDEXER_URL: "https://indexer.example",
  NEXT_PUBLIC_USDC_CONTRACT_ID: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  NEXT_PUBLIC_USDC_ISSUER: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

describe("loadPublicConfig", () => {
  it("parses a valid testnet config and derives the passphrase", () => {
    const c = loadPublicConfig(env);
    expect(c.NEXT_PUBLIC_RPC_URLS).toEqual(["https://rpc-a.example", "https://rpc-b.example"]);
    expect(c.networkPassphrase).toBe(NETWORK_PASSPHRASES.testnet);
  });

  it("refuses mainnet (testnet only until explicitly approved)", () => {
    expect(() => loadPublicConfig({ ...env, NEXT_PUBLIC_STELLAR_NETWORK: "mainnet" })).toThrow();
  });

  it("refuses missing or malformed values", () => {
    for (const bad of [
      { NEXT_PUBLIC_CONTRACT_ID: "GABC" },
      { NEXT_PUBLIC_USDC_CONTRACT_ID: undefined },
      { NEXT_PUBLIC_USDC_ISSUER: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA" },
      { NEXT_PUBLIC_RPC_URLS: "not a url" },
      { NEXT_PUBLIC_INDEXER_URL: "" },
    ]) {
      expect(() => loadPublicConfig({ ...env, ...bad })).toThrow();
    }
  });
});
