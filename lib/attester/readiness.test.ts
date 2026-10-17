import { describe, expect, it } from "vitest";
import {
  checkPayoutAccountReadiness,
  evaluateReadiness,
  type HorizonBalance,
  InvalidAddressError,
} from "./readiness";
import { isValidEd25519PublicKey } from "./strkey";

const VALID_ADDRESS = "GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM";
const VALID_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const DEFAULT_OPTS = {
  network: "testnet",
  minXlm: 2,
  assetCode: "USDC",
  assetIssuer: VALID_ISSUER,
};

describe("StrKey Address Validation", () => {
  it("accepts valid Stellar Ed25519 public addresses", () => {
    expect(isValidEd25519PublicKey(VALID_ADDRESS)).toBe(true);
    expect(isValidEd25519PublicKey(VALID_ISSUER)).toBe(true);
    expect(
      isValidEd25519PublicKey("GDPUY733T3UNZWG4EQMEBHBDGKD33YSFPOI2RB4AIK2JMOENKEXWK7ZG"),
    ).toBe(true);
    expect(
      isValidEd25519PublicKey("GBXKOYQ4MJ6UJGQBFXVXOP7XL7SKKJTFTYJUSNREP5FW4IHXPMWY2WSX"),
    ).toBe(true);
  });

  it("rejects invalid addresses with wrong prefix, short length, lowercase, or corrupted checksum", () => {
    // Starts with S (secret key)
    expect(
      isValidEd25519PublicKey("SCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM"),
    ).toBe(false);
    // Short length (55 chars)
    expect(isValidEd25519PublicKey("GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5Q")).toBe(
      false,
    );
    // Lowercase
    expect(
      isValidEd25519PublicKey("gCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QM"),
    ).toBe(false);
    // Corrupted checksum (last char changed from M to N)
    expect(
      isValidEd25519PublicKey("GCLMHF7LAR34TSELDNEREYPTNE4K7MMESPS62WXE7ZDLPWIJUF3MC5QN"),
    ).toBe(false);
  });
});

describe("Attester Readiness Evaluation (Pure Function & Parity)", () => {
  it("reports account not found when balances is null (Horizon 404)", () => {
    const report = evaluateReadiness(VALID_ADDRESS, null, DEFAULT_OPTS);
    expect(report.account.status).toBe("fail");
    expect(report.account.exists).toBe(false);
    expect(report.xlm).toBeNull();
    expect(report.trustline.status).toBe("fail");
    expect(report.trustline.kind).toBe("absent");
    expect(report.problemsCount).toBe(2); // account not found + trustline absent
  });

  it("evaluates healthy account with sufficient XLM and authorized USDC trustline with room", () => {
    const balances: HorizonBalance[] = [
      {
        asset_type: "native",
        balance: "100.5000000",
      },
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: VALID_ISSUER,
        balance: "50.0000000",
        limit: "10000.0000000",
        is_authorized: true,
      },
    ];

    const report = evaluateReadiness(VALID_ADDRESS, balances, DEFAULT_OPTS);
    expect(report.problemsCount).toBe(0);
    expect(report.account.status).toBe("pass");
    expect(report.account.exists).toBe(true);
    expect(report.xlm?.status).toBe("pass");
    expect(report.xlm?.balance).toBe(100.5);
    expect(report.trustline.status).toBe("pass");
    expect(report.trustline.kind).toBe("authorised");
  });

  it("catches insufficient XLM float (need >= 2 XLM)", () => {
    const balances: HorizonBalance[] = [
      {
        asset_type: "native",
        balance: "0.9999900",
      },
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: VALID_ISSUER,
        balance: "10.0000000",
        limit: "1000.0000000",
        is_authorized: true,
      },
    ];

    const report = evaluateReadiness(VALID_ADDRESS, balances, DEFAULT_OPTS);
    expect(report.problemsCount).toBe(1);
    expect(report.xlm?.status).toBe("fail");
    expect(report.xlm?.balance).toBe(0.99999);
    expect(report.trustline.status).toBe("pass");
  });

  it("CRITICAL: distinctly identifies missing trustline vs unauthorised trustline vs full limit", () => {
    // 1. Missing trustline (absent)
    const balancesAbsent: HorizonBalance[] = [
      {
        asset_type: "native",
        balance: "10.0000000",
      },
    ];
    const reportAbsent = evaluateReadiness(VALID_ADDRESS, balancesAbsent, DEFAULT_OPTS);
    expect(reportAbsent.trustline.status).toBe("fail");
    expect(reportAbsent.trustline.kind).toBe("absent");
    expect(reportAbsent.trustline.authorized).toBe(false);

    // 2. Unauthorised trustline (present but is_authorized: false)
    const balancesUnauth: HorizonBalance[] = [
      {
        asset_type: "native",
        balance: "10.0000000",
      },
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: VALID_ISSUER,
        balance: "0.0000000",
        limit: "1000.0000000",
        is_authorized: false,
      },
    ];
    const reportUnauth = evaluateReadiness(VALID_ADDRESS, balancesUnauth, DEFAULT_OPTS);
    expect(reportUnauth.trustline.status).toBe("fail");
    expect(reportUnauth.trustline.kind).toBe("unauthorised");
    expect(reportUnauth.trustline.authorized).toBe(false);

    // 3. No room (authorized but balance >= limit)
    const balancesFull: HorizonBalance[] = [
      {
        asset_type: "native",
        balance: "10.0000000",
      },
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: VALID_ISSUER,
        balance: "1000.0000000",
        limit: "1000.0000000",
        is_authorized: true,
      },
    ];
    const reportFull = evaluateReadiness(VALID_ADDRESS, balancesFull, DEFAULT_OPTS);
    expect(reportFull.trustline.status).toBe("fail");
    expect(reportFull.trustline.kind).toBe("no_room");
    expect(reportFull.trustline.authorized).toBe(true);

    // Assert that the three verdicts are distinctly differentiated
    expect(reportAbsent.trustline.kind).not.toEqual(reportUnauth.trustline.kind);
    expect(reportUnauth.trustline.kind).not.toEqual(reportFull.trustline.kind);
  });
});

describe("Client Fetch & StrKey Guard", () => {
  it("rejects invalid StrKey address before making any fetch call", async () => {
    await expect(checkPayoutAccountReadiness("invalid-address", DEFAULT_OPTS)).rejects.toThrowError(
      InvalidAddressError,
    );
  });
});
