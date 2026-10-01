import { expect, test } from "@playwright/test";

async function register(page, name, email) {
  await page.goto("/register");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("playwright-pass-123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("register, invite a member, add an expense, and settle the balance", async ({ page, browser }) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const ownerEmail = `blncr-owner-${suffix}@gmail.com`;
  const memberEmail = `blncr-member-${suffix}@gmail.com`;

  await register(page, "E2E Owner", ownerEmail);
  await page.getByRole("button", { name: "New group" }).click();
  await page.getByLabel("Group name").fill(`E2E Trip ${suffix}`);
  await page.getByRole("button", { name: "Create group" }).click();

  const groupLink = page.getByRole("link", { name: new RegExp(`E2E Trip ${suffix}`) });
  await expect(groupLink).toBeVisible();
  await groupLink.click();

  await page.getByRole("button", { name: "Members" }).click();
  await page.getByRole("button", { name: "Invite member" }).click();
  await page.getByRole("button", { name: "Create invite link" }).click();
  const inviteUrl = await page.getByRole("textbox", { name: "Group invite link" }).inputValue();

  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  await register(memberPage, "E2E Member", memberEmail);
  await memberPage.goto(inviteUrl);
  await expect(memberPage).toHaveURL(/\/groups\/\d+$/);
  await expect(memberPage.getByRole("heading", { name: new RegExp(`E2E Trip ${suffix}`) })).toBeVisible();
  await memberContext.close();

  await page.reload();
  await expect(page.getByRole("heading", { name: new RegExp(`E2E Trip ${suffix}`) })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole("button", { name: "Add expense" }).click();
  const expenseDialog = page.getByRole("dialog", { name: "Add expense" });
  const dialogBox = await expenseDialog.boundingBox();
  expect(dialogBox.width).toBeLessThanOrEqual(360);
  await page.getByLabel("Description").fill("E2E lunch");
  await page.getByLabel("Amount").fill("60.00");
  await page.getByRole("button", { name: "Add expense" }).last().click();
  await expect(page.getByText("E2E lunch")).toBeVisible();

  await page.getByRole("button", { name: "Balances" }).click();
  await page.getByRole("button", { name: "Settle", exact: true }).click();
  await page.getByRole("button", { name: "Record settlement" }).click();
  await expect(page.getByText("Everyone's settled up")).toBeVisible();
});