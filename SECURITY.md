# Security

Please report vulnerabilities privately. Policy: [Kinlock-Org/.github SECURITY.md](https://github.com/Kinlock-Org/.github/blob/main/SECURITY.md).

## Reporting a Vulnerability

Kinlock handles user-authorized escrow transactions on Stellar. If you discover a security vulnerability, privacy leak, or transaction integrity flaw, **do not open a public issue.** Report it privately through GitHub's "Report a vulnerability" (Private Security Advisories) on this repository, or email the maintainers directly:
- `adenikeajala2018@gmail.com`
- `Yazarayobami76@gmail.com`

## Response & Disclosure Timelines

- **Initial Acknowledgement:** We acknowledge receipt of vulnerability reports within **48 hours**.
- **Triage & Assessment:** We assess severity and provide a remediation plan or status update within **5 business days**.
- **Coordinated Disclosure:** Security patches will be prepared, verified, and released in coordinated disclosure with the reporter. We ask reporters to follow responsible disclosure practices and refrain from public disclosure until patches have landed.

## Scope

In scope for this repository:
- Non-custodial wallet interactions (`@creit.tech/stellar-wallets-kit`).
- Direct chain state reads via RPC for all money-moving pages (`/send`, `/claim`, `/locks`, `/verify`).
- Strict URL fragment privacy (`#r=...&s=...`), nonce-enforced Content Security Policy (CSP), and zero-analytics rules on sensitive routes.
