import { test, expect, type Page } from "@playwright/test";

async function watchEmailDrafts(page: Page) {
  const session = await page.context().newCDPSession(page);
  const drafts: string[] = [];
  await session.send("Page.enable");
  session.on("Page.frameRequestedNavigation", ({ url }) => {
    if (url.startsWith("mailto:")) drafts.push(url);
  });
  // The Playwright context owns and closes this CDP session, including on timeout.
  return drafts;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("mobile navigation takes visitors to the selected sections", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  const toggle = page.getByLabel("Open navigation", { exact: true });
  await expect(menu).not.toBeVisible();
  await toggle.click();
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "How it works", exact: true }).click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(page.locator("#how-it-works")).toBeInViewport();

  // Return to the header through the menu locator, as a visitor scrolling back would.
  await menu.getByRole("link", { name: "Try Paykit", exact: true }).click();
  await expect(page).toHaveURL(/#try-paykit$/);
  await expect(page.locator("#try-paykit")).toBeInViewport();
});

test("keyboard visitors can skip navigation and expand FAQ answers", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content", exact: true });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.closest("main") !== null)).toBe(true);

  const question = page.locator("summary").filter({ hasText: "Is Paykit a wallet?" });
  const answer = page.getByText("Paykit is an open payment coordination protocol. Wallets and services integrate it", { exact: false });
  await expect(answer).not.toBeVisible();
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(answer).toBeVisible();
  await expect(question).toBeFocused();
  await page.keyboard.press("Space");
  await expect(answer).not.toBeVisible();
});

test("the inquiry form blocks missing required fields and invalid email addresses", async ({ page }) => {
  await page.goto("/");
  const drafts = await watchEmailDrafts(page);
  const submit = page.getByRole("button", { name: "Open email draft" });
  const name = page.getByLabel("Your name", { exact: true });
  const email = page.getByLabel("Email address", { exact: true });
  const message = page.getByLabel("Tell us a little more", { exact: true });
  await submit.click();
  await expect(name).toBeFocused();
  await name.fill("Test Visitor");
  await submit.click();
  await expect(email).toBeFocused();
  await email.fill("not-an-email");
  await submit.click();
  await expect(email).toBeFocused();
  expect(await email.evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
  await email.fill("visitor@example.com");
  await submit.click();
  await expect(message).toBeFocused();
  await expect(page.getByRole("status", { includeHidden: true })).toHaveText("");
  await expect(page.getByRole("status")).not.toBeVisible();
  expect(drafts).toEqual([]);
});

test("email drafts preserve punctuation, Unicode, and line breaks without an organization", async ({ page }) => {
  await page.goto("/");
  const drafts = await watchEmailDrafts(page);
  const name = "Zoë O’Connor & Co";
  const email = "zoe+paykit@example.com";
  const message = "Can we pay €5 & ₿ together? #payments + 100%\nLine two: café &bcc=other@example.com";
  await page.getByLabel("Your name", { exact: true }).fill(name);
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("I’m interested in").selectOption("Service integration");
  await page.getByLabel("Tell us a little more", { exact: true }).fill(message);
  await expect(page.getByLabel("Organization", { exact: false })).toHaveValue("");
  await page.getByRole("button", { name: "Open email draft" }).click();
  await expect.poll(() => drafts.length).toBe(1);
  const draft = new URL(drafts[0]);
  expect(draft.pathname).toBe("info@synonym.to");
  expect([...draft.searchParams.keys()].sort()).toEqual(["body", "subject"]);
  expect(draft.hash).toBe("");
  expect(draft.searchParams.get("subject")).toBe("Paykit inquiry — Service integration");
  expect(draft.searchParams.get("body")).toBe(
    `Name: ${name}\nEmail: ${email}\nOrganization: —\nInterest: Service integration\n\n${message}`,
  );
  await expect(page.getByRole("status")).toContainText("email app");
});
