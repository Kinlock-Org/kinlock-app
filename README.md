# kinlock-app

[![CI](https://github.com/Kinlock-Org/kinlock-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Kinlock-Org/kinlock-app/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-live-brightgreen)](https://kinlock-app.vercel.app)

Next.js web app: payee requests, sender flow, claim, attester checks, receipts.

> **Status: active development, testnet only.** Send, claim, decline, and lock-detail flows work end to end against testnet; the payee dashboard and attester tooling are still open. See `ROADMAP.md`.

**Live app (testnet):** [kinlock-app.vercel.app](https://kinlock-app.vercel.app) · **Docs:** [kinlock-org.github.io](https://kinlock-org.github.io)

## Quick start
```
pnpm install
pnpm dev
```

## Read first
- `docs/ARCHITECTURE_ESSENTIALS.md` (short; read at the start of every task)
- `AGENTS.md` (rules for humans and agents) and `CLAUDE.md`
- `ROADMAP.md`: **every PR updates it**

Docs in `docs/` are read-only copies synced from [Kinlock-Org/.github](https://github.com/Kinlock-Org/.github).

Found a documentation gap (missing, unclear, or outdated docs)? File it at [Kinlock-Org.github.io](https://github.com/Kinlock-Org/Kinlock-Org.github.io/issues/new/choose) with `area:app`, the org's documentation hub, not here.
