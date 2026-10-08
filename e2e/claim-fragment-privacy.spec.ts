/**
 * [sec] The claim-link fragment (#r=<reference>&s=<salt>) must never reach a server, log,
 * analytics tool, error tracker, or third-party script (hard rule 5, AGENTS.md §3). This is the
 * automated check roadmap M3-14 asks for: load /claim/[id] with a real fragment, capture every
 * outbound network request the page makes for its whole lifetime, and fail if the reference or
 * salt shows up anywhere in a URL, request body, or request header.
 *
 * Browsers never send the fragment in the initial navigation request by design; the real risk
 * this guards against is a later JS-initiated request (an RPC call, an indexer call, a third-party
 * script, an error-tracker payload) echoing `window.location.href` or similar. The request
 * listener below is attached before navigation, so it also covers the initial request.
 *
 * Lock 11 is a real lock on the testnet contract (created 2026-10-08, verifying roadmap M3-06);
 * any Open lock id would do, since this test never checks whether the reference is valid.
 */
import { buildClaimLink, generateSalt } from "@kinlock/sdk";
import { expect, test } from "@playwright/test";

const SECRET_REFERENCE = "e2e-fragment-privacy-check-reference";
// Must be a real generateSalt()-shaped value: parseClaimLink (and so the app's own fragment
// handling) rejects anything else before ever reaching the code this test is trying to exercise.
const SECRET_SALT = generateSalt();
const LOCK_ID = "11";

test("the claim-link fragment never appears in any network request", async ({ page }) => {
  const leaks: string[] = [];
  const containsSecret = (text: string) =>
    text.includes(SECRET_REFERENCE) || text.includes(SECRET_SALT);

  page.on("request", (request) => {
    const url = request.url();
    if (containsSecret(url)) leaks.push(`URL: ${url}`);

    const postData = request.postData();
    if (postData && containsSecret(postData)) leaks.push(`BODY (${url}): ${postData}`);

    for (const [key, value] of Object.entries(request.headers())) {
      if (containsSecret(value)) leaks.push(`HEADER ${key} (${url}): ${value}`);
    }
  });

  const link = buildClaimLink("http://localhost:3000", {
    lockId: BigInt(LOCK_ID),
    reference: SECRET_REFERENCE,
    salt: SECRET_SALT,
  });
  await page.goto(link.replace("http://localhost:3000", ""));
  await page.waitForSelector("main dl", { timeout: 10_000 });
  // A fixed window rather than networkidle: the page polls (wallet/RPC checks), so network
  // activity never truly goes idle; this still gives any delayed request time to fire.
  await page.waitForTimeout(2000);

  expect(leaks).toEqual([]);
});
