
import { expect, test } from "@playwright/test";

async function register(page, name, email) {
  await page.goto("/register");

  // Log failed API responses to help identify backend issues.
  page.on("response", async (response) => {
    if (response.status() >= 400) {
      console.error(
        `[API ERROR] ${response.status()} ${response.url()}`
      );

      try {
        console.error("Response:", await response.text());
      } catch {
        console.error("Could not read response body.");
      }
    }
  });

  page.on("pageerror", (error) => {
    console.error("[PAGE ERROR]", error.message);
  });

  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("playwright-pass-123");
  await page.getByRole("checkbox").check();

  await page.getByRole("button", { name: "Create account" }).click();

  try {
    await expect(page).toHaveURL(/\/dashboard$/, {
      timeout: 20000,
    });
  } catch {
    const pageContent = await page.locator("body").innerText();

    throw new Error(
      `Registration failed for ${email}.\n` +
      `Current URL: ${page.url()}\n` +
      `Visible page content:\n${pageContent}`
    );
  }
}

test("register, invite a member, add an expense, and settle the balance", async ({
  page,
  browser,
}) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  const ownerEmail = `blncr-owner-${suffix}@gmail.com`;
  const memberEmail = `blncr-member-${suffix}@gmail.com`;

  // 1. Register owner
  await register(page, "E2E Owner", ownerEmail);

  // 2. Create group
  await page.getByRole("button", { name: "New group" }).click();

  await page.getByLabel("Group name").fill(`E2E Trip ${suffix}`);

  await page.getByRole("button", { name: "Create group" }).click();

  const groupLink = page.getByRole("link", {
    name: new RegExp(`E2E Trip ${suffix}`),
  });

  await expect(groupLink).toBeVisible({ timeout: 15000 });

  await groupLink.click();

  // 3. Generate invitation
  await page.getByRole("button", { name: "Members" }).click();

  await page.getByRole("button", { name: "Invite member" }).click();

  await page.getByRole("button", { name: "Create invite link" }).click();

  const inviteUrl = await page
    .getByRole("textbox", { name: "Group invite link" })
    .inputValue();

  expect(inviteUrl).toBeTruthy();

  // 4. Register member in a separate browser context
  const memberContext = await browser.newContext();

  try {
    const memberPage = await memberContext.newPage();

    await register(memberPage, "E2E Member", memberEmail);

    await memberPage.goto(inviteUrl);

    await expect(memberPage).toHaveURL(/\/groups\/\d+$/, {
      timeout: 15000,
    });

    await expect(
      memberPage.getByRole("heading", {
        name: new RegExp(`E2E Trip ${suffix}`),
      })
    ).toBeVisible();

  } finally {
    await memberContext.close();
  }

  // 5. Reload group as owner
  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: new RegExp(`E2E Trip ${suffix}`),
    })
  ).toBeVisible();

  // 6. Test responsive expense modal
  await page.setViewportSize({
    width: 360,
    height: 800,
  });

  await page.getByRole("button", { name: "Add expense" }).click();

  const expenseDialog = page.getByRole("dialog", {
    name: "Add expense",
  });

  await expect(expenseDialog).toBeVisible();

  const dialogBox = await expenseDialog.boundingBox();

  expect(dialogBox).not.toBeNull();
  expect(dialogBox.width).toBeLessThanOrEqual(360);

  // 7. Add expense
  await page.getByLabel("Description").fill("E2E lunch");

  await page.getByLabel("Amount").fill("60.00");

  await page.getByRole("button", { name: "Add expense" }).last().click();

  try {
    await expect(page.getByText("E2E lunch")).toBeVisible({
      timeout: 20000,
    });
  } catch {
    const pageContent = await page.locator("body").innerText();

    throw new Error(
      `Expense creation failed.\n` +
      `Current URL: ${page.url()}\n` +
      `Visible page content:\n${pageContent}`
    );
  }

  // 8. Settle balance
  await page.getByRole("button", { name: "Balances" }).click();

  await page.getByRole("button", { name: "Settle", exact: true }).click();

  await page.getByRole("button", { name: "Record settlement" }).click();

  await expect(
    page.getByText("Everyone's settled up")
  ).toBeVisible({
    timeout: 15000,
  });
});