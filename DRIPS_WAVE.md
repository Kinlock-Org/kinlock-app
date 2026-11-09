# Kinlock Web App — Drips Wave Application & Review Summary

> Program: [Stellar Wave on Drips Network](https://www.drips.network/wave/stellar) (backed by the Stellar Development Foundation)  
> Organization: [`Kinlock-Org`](https://github.com/Kinlock-Org)  
> Repository: `Kinlock-Org/kinlock-app` (Next.js Web Application)

This document provides a single-page executive and technical summary for the Drips Wave review panel evaluating Kinlock for inclusion in the Stellar Wave Program.

---

## 1. Project Overview & Real-World Utility

**Kinlock App** is the user-facing web portal allowing senders to create locks, payees to issue payment requests and claim funds, and public observers to verify institutional receipts on Stellar.

- **Real-World Problem:** Payments for education and housing can be difficult to reconcile and verify, especially when sender and payee are far apart. Kinlock provides a non-custodial way to lock USDC for a verified institution or any Stellar address, with scheduled releases and public on-chain receipts. The product is market-agnostic and launches market by market; it does not claim that a receipt proves a service was delivered.
- **Frontend Architecture & Stellar Integration:**
  - **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS.
  - **Wallet Integration:** Swappable multi-wallet support via `@creit.tech/stellar-wallets-kit` (Freighter, xBull, Albedo, Lobstr).
  - **Chain is Truth:** Every money-moving route (`/send`, `/claim/[id]`, `/locks/[id]`, `/verify`) reads verified state directly from Stellar RPC via `@kinlock/sdk`, ensuring no stale caching or intermediary database dependency for fund operations.
  - **Strict Client-Side Privacy:**
    - Reference identifiers live exclusively in URL hash fragments (`#r=...&s=...`), strictly preventing client credentials and private references from reaching web servers, analytics tools, or access logs.
    - Nonce-enforced Content Security Policy (CSP) and site-wide `Referrer-Policy: no-referrer`. Zero third-party analytics scripts on sensitive claim paths.
  - **Universal & Market-Agnostic Core:**
    - User-visible strings are externalized in the English message file; translated language packs are not yet provided.
    - Number, currency, and date formatting use native `Intl` APIs.
    - Country and local-currency values come from payee registry data. The sender currently displays USD only because the app has no live FX-rate provider.

---

## 2. Live Deployed Artifacts & Verification

| Resource | Link / Reference |
|---|---|
| **Live Web App (Testnet)** | [kinlock-app.vercel.app](https://kinlock-app.vercel.app) |
| **Documentation Hub** | [kinlock-org.github.io](https://kinlock-org.github.io) |
| **Indexer API Health** | [indexer-production-705a.up.railway.app/health](https://indexer-production-705a.up.railway.app/health) |
| **Contract ID (Testnet)** | [`CCSHDQFRYFC3AHV5NE6ULQW6X2CMG5RPANBORDXJGSUD6UKECASJQBRI`](https://stellar.expert/explorer/testnet/contract/CCSHDQFRYFC3AHV5NE6ULQW6X2CMG5RPANBORDXJGSUD6UKECASJQBRI) |
| **Admin Address (2-of-3 Multisig)** | `GDFOEZ673H2FMB4UUD57BPR76PJJQJCK7U2LND25QW5377Y6VUGKCWPV` |
| **Allowlisted USDC SAC Address** | `CAQCFVLOBWSG3DRR6CE67D5Q46MVAJWJ2K7G4GB5T3D56D3N25T7P2N6` |
| **Product Video Demo** | [media/kinlock-brag.mp4](media/kinlock-brag.mp4) |

---

## 3. Reviewer Checklist & Repository Hygiene

- [x] **Hosted under Organization:** [`Kinlock-Org`](https://github.com/Kinlock-Org)
- [x] **Permissive License:** Apache-2.0 ([`LICENSE`](LICENSE))
- [x] **Branch Protection:** The live `main` rules require one approval and the `ci`, `docs-in-sync`, `e2e`, and `roadmap-check` status checks (checked 2026-11-06).
- [x] **Continuous Integration (CI):** Green GitHub Actions validating Biome linting, TypeScript `tsc --noEmit`, Vitest test runner, and Next.js production build
- [x] **Security Hardening:**
  - CodeQL SAST scanning (Actions, JavaScript/TypeScript)
  - Semgrep code security checks
  - Strict input sanitization with Zod
  - Hardened headers: CSP with dynamic script-src hashes, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`
- [x] **Testing Rigor:**
  - 16 test files and 197 passing tests on the reviewed working branch (`pnpm test`, run 2026-11-06)
  - Automated tests cover CSP headers, schedule calculation, receipt and claim behavior, inline strings, and country-agnostic neutrality. Pull requests run the browser claim-fragment privacy test without signing credentials; the full testnet request → send → claim → verify Playwright flow runs only on protected-main pushes. The full flow previously passed in CI (`M3-19`); the updated workflow still needs a real fork-PR and protected-main run.
- [x] **Roadmap & Progress Tracking:** Every PR tracked and enforced via [`ROADMAP.md`](ROADMAP.md)

---

## 4. Drips Wave Task Queue & Issue Board

The live issue tracker is authoritative for available work; tasks and point values change as issues are completed or program guidance changes. Before starting, contributors should confirm an issue is still open, assigned as required, mapped to a current roadmap item, and within the safe contribution scope. Contract fund logic and other security-sensitive changes require maintainer review and are not ordinary Wave tasks.

> **Task safety:** Money-moving decisions read chain state, not Postgres. Claim-link references stay in the browser and must never be logged or sent to a server. Follow the repository contribution guide and issue acceptance criteria.

- **Open issues:** [Kinlock App issues](https://github.com/Kinlock-Org/kinlock-app/issues?q=is%3Aissue+is%3Aopen)
- **Contribution guide:** [`CONTRIBUTING.md`](CONTRIBUTING.md) and the [Wave issue format](https://github.com/Kinlock-Org/.github/blob/main/docs/wave-issue-format.md)
- **Current implementation and remaining tasks:** [`ROADMAP.md`](ROADMAP.md)

---

## 5. Core Maintainers

| Name | Role | GitHub | Contact |
|---|---|---|---|
| Ayobami Yazar | Core Maintainer (Full-Stack & Integrations) | [@YazarAyobami](https://github.com/YazarAyobami) | [Email](mailto:Yazarayobami76@gmail.com) |
| Adenike Ajala | Core Maintainer (Smart Contracts & Protocol) | [@abrcrmb](https://github.com/abrcrmb) | [Email](mailto:adenikeajala2018@gmail.com) |
