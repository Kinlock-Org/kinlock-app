# kinlock-app

[![CI](https://github.com/Kinlock-Org/kinlock-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Kinlock-Org/kinlock-app/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Kinlock-Org/kinlock-app/badge)](https://scorecard.dev/viewer/?uri=github.com/Kinlock-Org/kinlock-app)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-live-brightgreen)](https://kinlock-app.vercel.app)

The Next.js front end: payee payment requests, the sender's lock flow, the payee's claim, and public receipts. **Testnet only, with test assets.**

**Live app (testnet):** [kinlock-app.vercel.app](https://kinlock-app.vercel.app) · **Docs:** [kinlock-org.github.io](https://kinlock-org.github.io)

## See it in action

A 25-second overview of the flow — lock USDC for a verified payee, the payee claims, and the receipt reads "Payment to verified payee." Testnet, illustrative data.

<video src="media/kinlock-brag.mp4" controls width="640" poster="media/kinlock-brag-poster.jpg"></video>

> If the clip doesn't play inline, download it: [media/kinlock-brag.mp4](media/kinlock-brag.mp4).

## What works today

| Route | State |
|---|---|
| `/` | Landing, how-it-works, principles |
| `/request` | Payee builds a payment-request link (amount, reference, schedule) |
| `/send` | Sender picks a payee, sets a schedule, sees preflight results, funds a lock, gets a claim link |
| `/claim/[id]` | Payee verifies the reference against the on-chain `ref_hash`, then releases or declines |
| `/locks/[id]` | Lock detail with refund, shown only when the contract allows it |
| `/r/[txHash]/[eventIndex]`, `/verify` | Receipts rebuilt from chain data. "Payment to verified payee" — nothing more |
| `/payee` | Payee dashboard: connect a wallet, view and filter locks addressed to the payee, and open a lock's claim page. List data comes from the indexer; actions read chain state. |
| `/attester` | Placeholder page; the read-only account-check tooling is not implemented yet (`M3-12`). |

> **Status:** the sender, claim, lock-detail, payee dashboard and receipt flows are implemented. Money-moving actions and receipt verification read chain state through the SDK; the payee dashboard uses indexer data for lists. The Playwright request → send → claim → verify test is implemented, and the roadmap records it as passing in CI (`M3-19`). Local E2E runs need the dedicated testnet setup and signing secrets. There is no live FX-rate provider yet, so the app shows USD only with an explanatory note. See `ROADMAP.md` for current status and remaining work.

## The rules this repo exists to enforce

- **Chain is truth.** Every page that can move money calls `getLock` / `getPayee` / `verifyReceipt`. Postgres-backed lists are for dashboards, and the dashboard doesn't read them for actions.
- **The claim-link fragment stays in the browser.** `#r=…&s=…` is never sent to a server, logged, or handed to a third party. `/claim/*` gets a nonce-only CSP from `proxy.ts`, `Referrer-Policy: no-referrer` site-wide, and **zero third-party scripts or analytics**. Saved claim links live in `localStorage` with an export option.
- **Money is shown honestly.** `AssetLabel` always prints code *and* issuer; `AmountDisplay` formats from `bigint`; `DateTimeDisplay` shows UTC and local time. `RateProvider` is an interface with no implementation yet — the rate path fails closed to USD-only rather than inventing a number (`M3-16`, `DEC-10`).
- **Nothing is hard-coded to a country.** Country and `local_currency` come from registry data. Every user-visible string lives in `messages/en.json`, keys are type-checked, and a test fails the build on an inline string; `Intl` handles numbers, currencies and dates (`M3-23` done — other locales are deferred, not missing by accident).
- **Only `lib/sdk.ts` talks to the contract.** Wallets go through `lib/wallet/` using the Stellar Wallets Kit, so Freighter, xBull, Albedo and Lobstr are swappable.

Payee discovery in `/send`, `/request`, and `/payee` reads from the configured indexer. If the indexer is not configured or is unavailable, the pages display an honest unavailable state (`pages.*.indexerDown`). Money-moving actions and receipt verification read chain state directly through the SDK (hard rule 3: chain is truth).

## Quick start

```
pnpm install
pnpm dev
pnpm lint && pnpm typecheck && pnpm test
pnpm e2e                                    # Playwright; requires configured testnet E2E setup and secrets
```

Next.js 16 (App Router), React 19, TypeScript 7, Tailwind 4. Node 20 in CI.

Configuration is Zod-validated in `lib/config.ts`. Required: `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_RPC_URLS`, `NEXT_PUBLIC_CONTRACT_ID`, `NEXT_PUBLIC_USDC_CONTRACT_ID`, `NEXT_PUBLIC_USDC_ISSUER`. `NEXT_PUBLIC_INDEXER_URL` is optional — only list views need it, and the deployed testnet app currently runs without it. Copy `.env.example` to `.env.local`; never commit values.

Vercel deploys are currently **manual** (`vercel --prod`); a merged PR does not go live by itself.

## Maintainers

| Name | Role | GitHub | Contact |
|---|---|---|---|
| Adenike Ajala | Core Maintainer (Smart Contracts & Protocol) | [@abrcrmb](https://github.com/abrcrmb) | [Email](mailto:adenikeajala2018@gmail.com) |
| Ayobami Yazar | Core Maintainer (Full-Stack & Integrations) | [@YazarAyobami](https://github.com/YazarAyobami) | [Email](mailto:Yazarayobami76@gmail.com) |

## Community & Discussions

- **Discussions:** [GitHub Discussions](https://github.com/Kinlock-Org/kinlock-app/discussions)
- **Live Testnet Demo:** [kinlock-app.vercel.app](https://kinlock-app.vercel.app)
- **Documentation Portal:** [kinlock-org.github.io](https://kinlock-org.github.io)
- **Report Security Vulnerabilities:** Follow [`SECURITY.md`](SECURITY.md)

## Contributors

Thanks to everyone who has contributed to Kinlock!

[![Contributors](https://contrib.rocks/image?repo=Kinlock-Org/kinlock-app)](https://github.com/Kinlock-Org/kinlock-app/graphs/contributors)

## Read first

- `docs/ARCHITECTURE_ESSENTIALS.md` (short; read at the start of every task)
- `AGENTS.md` (rules for humans and agents) and `CLAUDE.md`
- `ROADMAP.md`: **every PR updates it**

`next.config.ts`, `proxy.ts`, `app/claim/**` and `lib/claim-links/**` are **security-sensitive**: ask before changing them, and label the PR accordingly.

Docs in `docs/` are read-only copies synced from [Kinlock-Org/.github](https://github.com/Kinlock-Org/.github).

Found a documentation gap (missing, unclear, or outdated docs)? File it at [Kinlock-Org.github.io](https://github.com/Kinlock-Org/Kinlock-Org.github.io/issues/new/choose) with `area:app`, the org's documentation hub, not here.
