# Copy Review & Plain-Language Audit

**Repository**: `kinlock-app`  
**Task**: Issue [#16](https://github.com/Kinlock-Org/kinlock-app/issues/16) (`Sweep every user-facing string for honesty and plain language, then widen the phrase guard`)  
**Scope**: All 293 user-facing strings defined in `messages/en.json`  
**Date**: October 2026  

---

## 1. Regulatory & Architectural Constraints

This copy audit enforces the binding constraints documented across the Kinlock system:

1. **Hard Rule 7 (`AGENTS.md` §3 & PRD `RCP-3`)**:
   - Receipts assert strictly: *"Payment to verified payee"*, nothing stronger.
   - Prohibits overclaiming delivery, usage, service execution, or unconditional guarantees (e.g. *"proof of use"*, *"service delivered"*, *"guaranteed delivery"*, *"verified use of funds"*).
2. **Hard Rule 5 (`AGENTS.md` §3 & §8.3)**:
   - Fragment secrecy: claim links store secret pre-image fragments only in client-side storage / URLs. `pages.claim.*` and `claimLinks.*` copy explicitly informs users that Kinlock holds no server-side copy.
3. **Hard Rule 11 (`lib/country-agnostic.test.ts`)**:
   - Universal phrasing: no region-specific banking terms or local currency idioms.
4. **PRD `E30` (Plain Language & Accessibility)**:
   - Designed for low-literacy users, shared mobile phones, and non-native English speakers.
   - Sentences are capped at 30 words to eliminate run-on clauses while preserving load-bearing truth disclosures (such as `common.indexerLagNotice`).
   - Technical jargon is minimized: avoids confusing colloquialisms like *"the blockchain"* in favour of exact designations (*"on chain"*, *"the Stellar network"*, or *"contract rules"*).

---

## 2. Terminology Harmonization

The audit resolved inconsistent mentions of ledger and network interactions across in-scope namespaces:

| Key | Original Copy | Audited & Harmonized Copy | Rationale |
| :--- | :--- | :--- | :--- |
| `pages.send.errorContract` | *The blockchain refused this payment. Nothing was sent.* | **Contract rules prevented this payment. Nothing was sent.** | Accurately identifies smart contract condition failure rather than attributing generic refusal to "the blockchain". |
| `common.indexerLagNotice` | *...check the blockchain directly...* | **...check the Stellar network directly...** | Replaces generic jargon with canonical network identifier. |
| `receipt.reason.not_found` | *...exists on the blockchain.* | **...exists on chain.** | Standardizes on concise, unambiguous "on chain" state description. |
| `receipt.reason.mismatch` | *...match what's on the blockchain.* | **...match what's on chain.** | Standardizes on "on chain" state description. |
| `pages.lock.intro` | *Read directly from the blockchain.* | **Read directly from the Stellar network.** | Plain, accurate network reference. |
| `pages.lock.errorNotAllowed` | *The blockchain doesn't allow a refund yet. Nothing was moved.* | **Contract rules do not allow a refund yet. Nothing was moved.** | Clarifies that time lock / release rules are enforced by the contract logic. |
| `pages.payee.loading` | *Reading your payments from the blockchain…* | **Reading your payments from the Stellar network…** | Clear, standard network status indicator. |
| `pages.receipt.loading` | *Reading this receipt from the blockchain…* | **Reading this receipt from the Stellar network…** | Clear, standard network status indicator. |
| `pages.verify.intro` | *...check it directly against the blockchain.* | **...check it directly against the Stellar network.** | Clear, standard network verification indicator. |

*Note: In accordance with the issue specification, `pages.claim.*` keys remain untouched in this PR to preserve claim-fragment isolation.*

---

## 3. String Inventory & Length Distribution

- **Total Strings Swept**: 293
- **Namespaces Covered**:
  - `app` (5 keys)
  - `common` (32 keys)
  - `nav` (7 keys)
  - `receipt` (24 keys)
  - `pages` (166 keys)
  - `money` (12 keys)
  - `time` (14 keys)
  - `claimLinks` (15 keys)
  - `preflight` (18 keys)
- **Word Length Cap**: Capped at $\le 30$ words.
  - Maximum observed length: 29 words (`common.indexerLagNotice`), providing essential visibility lag context without exceeding cognitive bounds.

---

## 4. Automated Regression Guards

The test suite in [`lib/i18n/messages.test.ts`](file:///G:/明星图片/kinlock-app/lib/i18n/messages.test.ts) has been expanded to enforce these invariants on every CI run:

1. **Exact Receipt Headline**: Asserts `t("receipt.headline") === "Payment to verified payee"`.
2. **Non-Empty String Resolution**: Confirms all 293 keys resolve to non-empty strings.
3. **Expanded Banned Overclaim Family**:
   Blocks phrases that exaggerate guarantee or delivery:
   - `"proof of use"`
   - `"service delivered"`
   - `"guaranteed delivery"`
   - `"guaranteed payment"`
   - `"unconditional guarantee"`
   - `"fully delivered"`
   - `"verified use of funds"`
   - `"100% secure"`
   - `"zero risk"`
   - `"proof of delivery"`
   - `"verified delivery"`
   - `"unconditional refund"`
   - `"unconditional release"`
4. **Length Ceiling Guard**: Validates that no string exceeds 30 words.
