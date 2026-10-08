# kinlock-app

[![CI](https://github.com/Kinlock-Org/kinlock-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Kinlock-Org/kinlock-app/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-live-brightgreen)](https://kinlock-app.vercel.app)

The Next.js front end: payee payment requests, the sender's lock flow, the payee's claim, and public receipts. **Testnet only, with test assets.**

**Live app (testnet):** [kinlock-app.vercel.app](https://kinlock-app.vercel.app) · **Docs:** [kinlock-org.github.io](https://kinlock-org.github.io)

## What works today

| Route | State |
|---|---|
| `/` | Landing, how-it-works, principles |
| `/request` | Payee builds a payment-request link (amount, reference, schedule) |
| `/send` | Sender picks a payee, sets a schedule, sees preflight results, funds a lock, gets a claim link |
| `/claim/[id]` | Payee verifies the reference against the on-chain `ref_hash`, then releases or declines |
| `/locks/[id]` | Lock detail with refund, shown only when the contract allows it |
| `/r/[txHash]/[eventIndex]`, `/verify` | Receipts rebuilt from chain data. "Payment to verified payee" — nothing more |
| `/payee`, `/attester` | **Stubs** (`M3-11`, `M3-12`) |

> **Status: the core money flows are real; the dashboard isn't.** Claim, decline, refund, receipts and verify read the **chain** through the SDK, never the indexer. `/send` is `M3-06` in progress, the Playwright happy path (`M3-19`) is still a `test.fixme` stub, and there is no live FX rate yet, so amounts show **USD only with a note**. Full state in `ROADMAP.md` (Phase 4: 11 `DONE`, 6 `IN PROGRESS`, 9 `TODO`).

## The rules this repo exists to enforce

- **Chain is truth.** Every page that can move money calls `getLock` / `getPayee` / `verifyReceipt`. Postgres-backed lists are for dashboards, and the dashboard doesn't read them for actions.
- **The claim-link fragment stays in the browser.** `#r=…&s=…` is never sent to a server, logged, or handed to a third party. `/claim/*` gets a nonce-only CSP from `proxy.ts`, `Referrer-Policy: no-referrer` site-wide, and **zero third-party scripts or analytics**. Saved claim links live in `localStorage` with an export option.
- **Money is shown honestly.** `AssetLabel` always prints code *and* issuer; `AmountDisplay` formats from `bigint`; `DateTimeDisplay` shows UTC and local time. `RateProvider` is an interface with no implementation yet — the rate path fails closed to USD-only rather than inventing a number (`M3-16`, `DEC-10`).
- **Nothing is hard-coded to a country.** Country and `local_currency` come from registry data. Every user-visible string lives in `messages/en.json`, keys are type-checked, and a test fails the build on an inline string; `Intl` handles numbers, currencies and dates (`M3-23` done — other locales are deferred, not missing by accident).
- **Only `lib/sdk.ts` talks to the contract.** Wallets go through `lib/wallet/` using the Stellar Wallets Kit, so Freighter, xBull, Albedo and Lobstr are swappable.

One caveat worth knowing: until the app is wired to the deployed indexer, `/send` and `/request` offer the payees in `lib/payees/known.ts` — a checked-in snapshot of the three testnet fixture payees (KE, NG, PH). It is not trusted for display: each entry's `payee_id` and `meta_hash` are re-derived locally and matched against a live `getPayee` chain read, and status and payout address always come from chain.

## Quick start

```
pnpm install
pnpm dev
pnpm lint && pnpm typecheck && pnpm test    # biome, tsc, vitest (13 files, 69 cases)
pnpm e2e                                    # placeholder until M3-19
```

Next.js 16 (App Router), React 19, TypeScript 7, Tailwind 4. Node 20 in CI.

Configuration is Zod-validated in `lib/config.ts`. Required: `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_RPC_URLS`, `NEXT_PUBLIC_CONTRACT_ID`, `NEXT_PUBLIC_USDC_CONTRACT_ID`, `NEXT_PUBLIC_USDC_ISSUER`. `NEXT_PUBLIC_INDEXER_URL` is optional — only list views need it, and the deployed testnet app currently runs without it. Copy `.env.example` to `.env.local`; never commit values.

Deploys to Vercel are currently **manual** (`vercel --prod`) — there's no deploy workflow, so a merged PR does not go live by itself.

## Read first

- `docs/ARCHITECTURE_ESSENTIALS.md` (short; read at the start of every task)
- `AGENTS.md` (rules for humans and agents) and `CLAUDE.md`
- `ROADMAP.md`: **every PR updates it**

`next.config.ts`, `proxy.ts`, `app/claim/**` and `lib/claim-links/**` are **security-sensitive**: ask before changing them, and label the PR accordingly.

Docs in `docs/` are read-only copies synced from [Kinlock-Org/.github](https://github.com/Kinlock-Org/.github).

Found a documentation gap (missing, unclear, or outdated docs)? File it at [Kinlock-Org.github.io](https://github.com/Kinlock-Org/Kinlock-Org.github.io/issues/new/choose) with `area:app`, the org's documentation hub, not here.
