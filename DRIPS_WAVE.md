# Kinlock Web App — Drips Wave Application & Review Summary

> Program: [Stellar Wave on Drips Network](https://www.drips.network/wave/stellar) (backed by the Stellar Development Foundation)  
> Organization: [`Kinlock-Org`](https://github.com/Kinlock-Org)  
> Repository: `Kinlock-Org/kinlock-app` (Next.js Web Application)

This document provides a single-page executive and technical summary for the Drips Wave review panel evaluating Kinlock for inclusion in the Stellar Wave Program.

---

## 1. Project Overview & Real-World Utility

**Kinlock App** is the user-facing web portal allowing senders to create locks, payees to issue payment requests and claim funds, and public observers to verify institutional receipts on Stellar.

- **Real-World Problem:** International payments for education, housing, and contracts suffer from lack of trust, opaque fee deductions, and custodial vulnerability. Kinlock provides a non-custodial, scheduled escrow interface directly bound to Soroban smart contracts.
- **Frontend Architecture & Stellar Integration:**
  - **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS.
  - **Wallet Integration:** Swappable multi-wallet support via `@creit.tech/stellar-wallets-kit` (Freighter, xBull, Albedo, Lobstr).
  - **Chain is Truth:** Every money-moving route (`/send`, `/claim/[id]`, `/locks/[id]`, `/verify`) reads verified state directly from Stellar RPC via `@kinlock/sdk`, ensuring no stale caching or intermediary database dependency for fund operations.
  - **Strict Client-Side Privacy:**
    - Reference identifiers live exclusively in URL hash fragments (`#r=...&s=...`), strictly preventing client credentials and private references from reaching web servers, analytics tools, or access logs.
    - Nonce-enforced Content Security Policy (CSP) and site-wide `Referrer-Policy: no-referrer`. Zero third-party analytics scripts on sensitive claim paths.
  - **Universal & Market-Agnostic Core:**
    - 100% externalized internationalization strings (`messages/en.json`).
    - Dynamic currency and date formatting using native `Intl` APIs.
    - Zero hardcoded national currencies or assumptions; payee metadata is fetched from canonical registry definitions.

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
- [x] **Branch Protection:** Enforced on `main` (peer reviews required, required checks passing)
- [x] **Continuous Integration (CI):** Green GitHub Actions validating Biome linting, TypeScript `tsc --noEmit`, Vitest test runner, and Next.js production build
- [x] **Security Hardening:**
  - CodeQL SAST scanning (Actions, JavaScript/TypeScript)
  - Semgrep code security checks
  - Strict input sanitization with Zod
  - Hardened headers: CSP with dynamic script-src hashes, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`
- [x] **Testing Rigor:**
  - 16 test files with 187 passing unit and integration tests
  - Automated tests validating CSP headers, schedule calculation, refund triggers, receipt validation, inline string exclusions, and country-agnostic neutrality
- [x] **Roadmap & Progress Tracking:** Every PR tracked and enforced via [`ROADMAP.md`](ROADMAP.md)

---

## 4. Drips Wave Task Queue & Issue Board

Issues for external contributors follow a strict three-tier complexity mapping aligned with Drips Wave points:
- **Trivial (100 points):** Copy updates, accessibility improvements, ARIA landmarks, and UI state polish.
- **Medium (150 points):** Client-side export conveniences, locale selector enhancements, and transaction receipt formatting components.
- **High (200 points):** Comprehensive end-to-end integration workflows (Playwright happy-path test harnesses) and multi-wallet pairing fallbacks.

> **Task Safety Rule:** Under `AGENTS.md`, money-moving state transitions must never read from intermediary Postgres services, and URL fragment references must never be logged or sent off-device. Wave tasks strictly reinforce these guardrails.

- **Active Bounty Issues:** [Kinlock App Wave Issues](https://github.com/Kinlock-Org/kinlock-app/issues?q=is%3Aissue+is%3Aopen+label%3Adrips-wave%2Cwave)
- **Contribution Guide:** [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/wave-issue-format.md`](https://github.com/Kinlock-Org/.github/blob/main/docs/wave-issue-format.md)

---

## 5. Core Maintainers

| Name | Role | GitHub | Contact |
|---|---|---|---|
| Ayobami Yazar | Core Maintainer (Full-Stack & Integrations) | [@YazarAyobami](https://github.com/YazarAyobami) | [Email](mailto:Yazarayobami76@gmail.com) |
| Adenike Ajala | Core Maintainer (Smart Contracts & Protocol) | [@abrcrmb](https://github.com/abrcrmb) | [Email](mailto:adenikeajala2018@gmail.com) |
