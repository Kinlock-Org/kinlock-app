/**
 * The one full E2E: request -> send -> claim -> verify, against a real (dedicated, throwaway)
 * testnet contract. Roadmap M3-19.
 *
 * Signing is driven by the test-only keypair adapter (`lib/wallet/test-adapter.ts`), activated
 * only in this build via `NEXT_PUBLIC_E2E_TEST_MODE=1` (set in `.github/workflows/e2e.yml`).
 * Each browser context sets `window.__KINLOCK_E2E_TEST_SECRET__` via `addInitScript`, so the
 * sender and payee sign with different throwaway testnet keys without any real wallet UI.
 *
 * `E2E_SENDER_SECRET` and `E2E_PAYEE_SECRET` are read from the environment; they're never
 * written to a file or logged. `PAYEE_ID` is `sha256("ng-kinlock-e2e-test")` -- `/request` and
 * `/send` only list payees with registry-joined display data (`lib/indexer/index.ts`'s
 * `payable()`), so the fixture payee also needed a matching, hash-bound entry in
 * `kinlock-registry/fixtures/payees/ng/ng-kinlock-e2e-test.json` (and its attester in
 * `fixtures/attesters/kinlock-e2e-attester.json`), registered on the dedicated e2e-only
 * testnet contract (not the standing one in `DEPLOYMENTS.md`) -- see the roadmap changelog
 * entry for this row for how it was set up.
 */
import { expect, type Page, test } from "@playwright/test";

const PAYEE_ID = "d7b0001ebab9392f569b5cfc868803f517120926c8903fa9089c2e0d3f87f206";

function senderSecret(): string {
  const v = process.env.E2E_SENDER_SECRET;
  if (!v) throw new Error("E2E_SENDER_SECRET is not set");
  return v;
}

function payeeSecret(): string {
  const v = process.env.E2E_PAYEE_SECRET;
  if (!v) throw new Error("E2E_PAYEE_SECRET is not set");
  return v;
}

async function withTestWallet(page: Page, secret: string) {
  await page.addInitScript((s) => {
    (window as unknown as { __KINLOCK_E2E_TEST_SECRET__?: string }).__KINLOCK_E2E_TEST_SECRET__ = s;
  }, secret);
}

// Several real testnet round trips in sequence (create_lock, release, then verifyReceipt's
// own sequential event-index probe over up to 8 indices -- app/claim/[id]/claim-logic.ts's
// findReceiptIndex) comfortably exceed Playwright's 30s default against real RPC latency.
test.setTimeout(120_000);

test("request -> send -> claim -> verify", async ({ browser }) => {
  const senderContext = await browser.newContext();
  const payeeContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const payee = await payeeContext.newPage();
  await withTestWallet(sender, senderSecret());
  await withTestWallet(payee, payeeSecret());

  const reference = `e2e-happy-path-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  // 1. Payee creates a payment-request link.
  await payee.goto("/request");
  await payee.getByLabel("Who is being paid").selectOption({ value: PAYEE_ID });
  await payee.getByLabel("Payment reference").fill(reference);
  // The label is "Amount" plus AssetLabel (configured code and issuer), so match the prefix.
  await payee.getByLabel(/^Amount/).fill("1");
  await payee.getByLabel("Can be claimed from (UTC date)").fill(today);
  await payee.getByRole("button", { name: "Create link" }).click();
  const requestLink = await payee.locator("output").textContent();
  expect(requestLink).toBeTruthy();

  // 2. Sender opens the link, connects, reviews, and sends.
  const path = new URL(requestLink as string).pathname + new URL(requestLink as string).search;
  await sender.goto(path);
  await sender.getByRole("button", { name: "Connect wallet" }).click();
  await expect(sender.getByRole("button", { name: "Connect wallet" })).not.toBeVisible();
  await sender.getByRole("button", { name: "Check and review" }).click();
  const acknowledge = sender.getByLabel(/I've read the warnings above/);
  if (await acknowledge.isVisible().catch(() => false)) await acknowledge.check();
  await sender.getByRole("button", { name: "Lock and send" }).click();
  await expect(sender.getByRole("heading", { name: "Payment locked" })).toBeVisible({
    timeout: 30_000,
  });
  const claimLink = await sender.locator("output").textContent();
  expect(claimLink).toBeTruthy();

  // 3. Payee opens the claim link, connects, and releases the one tranche.
  const claimPath = new URL(claimLink as string).pathname + new URL(claimLink as string).hash;
  await payee.goto(claimPath);
  await expect(payee.getByText("The reference in this link matches")).toBeVisible();
  await payee.getByRole("button", { name: "Connect wallet" }).click();
  await payee.getByRole("button", { name: "Claim this payment" }).click();
  await expect(payee.getByText("Payment claimed.")).toBeVisible({ timeout: 30_000 });

  // 4. Anyone can verify the receipt from chain data. findReceiptIndex (claim-logic.ts) probes
  // up to 8 event indices sequentially against real chain data after the "claimed" text above
  // already renders, so the link itself can take a while longer to appear.
  const receiptLink = payee.getByRole("link", { name: "View receipt" });
  await expect(receiptLink).toBeVisible({ timeout: 60_000 });
  const receiptHref = await receiptLink.getAttribute("href");
  expect(receiptHref).toBeTruthy();
  await payee.goto(receiptHref as string);
  await expect(payee.getByText("Valid", { exact: true })).toBeVisible();
  await expect(payee.getByText("Payment to verified payee")).toBeVisible();

  await senderContext.close();
  await payeeContext.close();
});
