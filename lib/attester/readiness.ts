/**
 * Read-only payout account checks for attesters.
 * Roadmap M3-12 (depends on M1-26, check-attester-readiness.ts parity).
 *
 * Implements read-only account existence, native XLM float vs reserve threshold,
 * and USDC trustline verification (distinguishing missing vs unauthorised vs no room).
 * Purely read-only: no signing, no secret credentials, no transaction submission.
 */

import { isValidEd25519PublicKey } from "./strkey";

export const DEFAULT_MIN_XLM = 2;
export const DEFAULT_HORIZON_URL = "https://horizon-testnet.stellar.org";

export interface HorizonBalance {
  asset_type: string;
  balance: string;
  limit?: string;
  asset_code?: string;
  asset_issuer?: string;
  is_authorized?: boolean;
  is_authorized_to_maintain_liabilities?: boolean;
}

export interface HorizonAccountResponse {
  id: string;
  account_id: string;
  sequence?: string;
  balances: HorizonBalance[];
}

export type CheckStatus = "pass" | "fail";

export interface AccountVerdict {
  status: CheckStatus;
  exists: boolean;
  network: string;
}

export interface XlmVerdict {
  status: CheckStatus;
  balance: number;
  minRequired: number;
}

export type TrustlineVerdictKind = "authorised" | "unauthorised" | "absent" | "no_room";

export interface TrustlineVerdict {
  status: CheckStatus;
  kind: TrustlineVerdictKind;
  assetCode: string;
  assetIssuer: string;
  balance: string;
  limit: string;
  authorized: boolean;
}

export interface AttesterReadinessReport {
  address: string;
  network: string;
  problemsCount: number;
  account: AccountVerdict;
  xlm: XlmVerdict | null;
  trustline: TrustlineVerdict;
}

export interface ReadinessOptions {
  network?: string;
  minXlm?: number;
  assetCode: string;
  assetIssuer: string;
}

/**
 * Pure evaluation function: takes balances array (or null if account missing)
 * and returns the structured readiness report matching check-attester-readiness.ts verdicts.
 */
export function evaluateReadiness(
  address: string,
  balances: HorizonBalance[] | null,
  opts: ReadinessOptions,
): AttesterReadinessReport {
  const network = opts.network ?? "testnet";
  const minXlm = opts.minXlm ?? DEFAULT_MIN_XLM;
  let problemsCount = 0;

  // 1. Account existence check
  if (!balances) {
    problemsCount += 2; // Account missing AND trustline missing (matches check-attester-readiness problem count of 2)
    return {
      address,
      network,
      problemsCount,
      account: {
        status: "fail",
        exists: false,
        network,
      },
      xlm: null,
      trustline: {
        status: "fail",
        kind: "absent",
        assetCode: opts.assetCode,
        assetIssuer: opts.assetIssuer,
        balance: "0",
        limit: "0",
        authorized: false,
      },
    };
  }

  const account: AccountVerdict = {
    status: "pass",
    exists: true,
    network,
  };

  // 2. Native XLM float check
  const nativeEntry = balances.find((b) => b.asset_type === "native");
  const xlmBalance = nativeEntry ? Number.parseFloat(nativeEntry.balance) : 0;
  const xlmPass = xlmBalance >= minXlm;
  if (!xlmPass) {
    problemsCount += 1;
  }
  const xlm: XlmVerdict = {
    status: xlmPass ? "pass" : "fail",
    balance: xlmBalance,
    minRequired: minXlm,
  };

  // 3. Asset trustline check (USDC)
  const trustEntry = balances.find(
    (b) => b.asset_code === opts.assetCode && b.asset_issuer === opts.assetIssuer,
  );

  let trustline: TrustlineVerdict;
  if (!trustEntry) {
    problemsCount += 1;
    trustline = {
      status: "fail",
      kind: "absent",
      assetCode: opts.assetCode,
      assetIssuer: opts.assetIssuer,
      balance: "0",
      limit: "0",
      authorized: false,
    };
  } else {
    const isAuthorized = trustEntry.is_authorized !== false;
    const balanceNum = Number.parseFloat(trustEntry.balance);
    const limitNum = trustEntry.limit ? Number.parseFloat(trustEntry.limit) : 0;
    const hasRoom = limitNum > balanceNum;

    if (!isAuthorized) {
      problemsCount += 1;
      trustline = {
        status: "fail",
        kind: "unauthorised",
        assetCode: opts.assetCode,
        assetIssuer: opts.assetIssuer,
        balance: trustEntry.balance,
        limit: trustEntry.limit ?? "0",
        authorized: false,
      };
    } else if (!hasRoom) {
      problemsCount += 1;
      trustline = {
        status: "fail",
        kind: "no_room",
        assetCode: opts.assetCode,
        assetIssuer: opts.assetIssuer,
        balance: trustEntry.balance,
        limit: trustEntry.limit ?? "0",
        authorized: true,
      };
    } else {
      trustline = {
        status: "pass",
        kind: "authorised",
        assetCode: opts.assetCode,
        assetIssuer: opts.assetIssuer,
        balance: trustEntry.balance,
        limit: trustEntry.limit ?? "0",
        authorized: true,
      };
    }
  }

  return {
    address,
    network,
    problemsCount,
    account,
    xlm,
    trustline,
  };
}

export class InvalidAddressError extends Error {
  constructor(message = "Invalid Stellar Ed25519 public address") {
    super(message);
    this.name = "InvalidAddressError";
  }
}

/**
 * Live / client-side check function: queries public Horizon REST endpoint.
 * Validates address with StrKey before initiating any network access.
 */
export async function checkPayoutAccountReadiness(
  address: string,
  opts: ReadinessOptions & { horizonUrl?: string },
): Promise<AttesterReadinessReport> {
  const trimmed = address.trim();
  if (!isValidEd25519PublicKey(trimmed)) {
    throw new InvalidAddressError();
  }

  const horizonUrl = (opts.horizonUrl ?? DEFAULT_HORIZON_URL).replace(/\/+$/, "");
  const res = await fetch(`${horizonUrl}/accounts/${trimmed}`, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) {
    return evaluateReadiness(trimmed, null, opts);
  }

  if (!res.ok) {
    throw new Error(`Horizon error (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as HorizonAccountResponse;
  return evaluateReadiness(trimmed, data.balances ?? [], opts);
}
