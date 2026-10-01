# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-flow.spec.js >> register, invite a member, add an expense, and settle the balance
- Location: e2e\product-flow.spec.js:13:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('E2E lunch')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('E2E lunch') with timeout 15000ms
  - waiting for getByText('E2E lunch')

```

```yaml
- img
- img
- banner:
  - link "BLNCR BLNCR":
    - /url: /dashboard
    - img "BLNCR"
    - text: BLNCR
  - button "Switch to dark theme":
    - img
    - img
  - button "Open account menu":
    - text: EO
    - img
- main:
  - link "All groups":
    - /url: /dashboard
    - img
    - text: All groups
  - heading "E2E Trip 1790875055131-536639" [level=1]
  - text: USD
  - button "Settle up"
  - button "Add expense":
    - img
    - text: Add expense
  - button "Expenses":
    - img
    - text: Expenses
  - button "Balances":
    - img
    - text: Balances
  - button "Activity":
    - img
    - text: Activity
  - button "Members":
    - img
    - text: Members
  - img
  - paragraph: No expenses yet
  - paragraph: Add the first expense to start tracking who owes what.
  - dialog "Add expense":
    - heading "Add expense" [level=2]
    - button "Close":
      - img
    - text: Description
    - textbox "Description":
      - /placeholder: Dinner at Sultan's Dine
      - text: E2E lunch
    - text: Category
    - combobox "Category":
      - option "Food"
      - option "Transport"
      - option "Lodging"
      - option "Shopping"
      - option "Entertainment"
      - option "Utilities"
      - option "Health"
      - option "Other" [selected]
    - text: Amount $
    - spinbutton "Amount": "60.00"
    - text: Paid by
    - combobox "Paid by":
      - option "You" [selected]
      - option "E2E Member"
    - text: Split type
    - button "Equal"
    - button "Exact"
    - button "Percent"
    - text: Split between
    - checkbox "Include E2E Owner in split" [checked]
    - text: EO You
    - checkbox "Include E2E Member in split" [checked]
    - text: EM E2E Member
    - button "Cancel"
    - button "Add expense"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | async function register(page, name, email) {
  4  |   await page.goto("/register");
  5  |   await page.getByLabel("Name", { exact: true }).fill(name);
  6  |   await page.getByLabel("Email", { exact: true }).fill(email);
  7  |   await page.getByLabel("Password", { exact: true }).fill("playwright-pass-123");
  8  |   await page.getByRole("checkbox").check();
  9  |   await page.getByRole("button", { name: "Create account" }).click();
  10 |   await expect(page).toHaveURL(/\/dashboard$/);
  11 | }
  12 | 
  13 | test("register, invite a member, add an expense, and settle the balance", async ({ page, browser }) => {
  14 |   const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  15 |   const ownerEmail = `blncr-owner-${suffix}@gmail.com`;
  16 |   const memberEmail = `blncr-member-${suffix}@gmail.com`;
  17 | 
  18 |   await register(page, "E2E Owner", ownerEmail);
  19 |   await page.getByRole("button", { name: "New group" }).click();
  20 |   await page.getByLabel("Group name").fill(`E2E Trip ${suffix}`);
  21 |   await page.getByRole("button", { name: "Create group" }).click();
  22 | 
  23 |   const groupLink = page.getByRole("link", { name: new RegExp(`E2E Trip ${suffix}`) });
  24 |   await expect(groupLink).toBeVisible();
  25 |   await groupLink.click();
  26 | 
  27 |   await page.getByRole("button", { name: "Members" }).click();
  28 |   await page.getByRole("button", { name: "Invite member" }).click();
  29 |   await page.getByRole("button", { name: "Create invite link" }).click();
  30 |   const inviteUrl = await page.getByRole("textbox", { name: "Group invite link" }).inputValue();
  31 | 
  32 |   const memberContext = await browser.newContext();
  33 |   const memberPage = await memberContext.newPage();
  34 |   await register(memberPage, "E2E Member", memberEmail);
  35 |   await memberPage.goto(inviteUrl);
  36 |   await expect(memberPage).toHaveURL(/\/groups\/\d+$/);
  37 |   await expect(memberPage.getByRole("heading", { name: new RegExp(`E2E Trip ${suffix}`) })).toBeVisible();
  38 |   await memberContext.close();
  39 | 
  40 |   await page.reload();
  41 |   await expect(page.getByRole("heading", { name: new RegExp(`E2E Trip ${suffix}`) })).toBeVisible();
  42 |   await page.setViewportSize({ width: 360, height: 800 });
  43 |   await page.getByRole("button", { name: "Add expense" }).click();
  44 |   const expenseDialog = page.getByRole("dialog", { name: "Add expense" });
  45 |   const dialogBox = await expenseDialog.boundingBox();
  46 |   expect(dialogBox.width).toBeLessThanOrEqual(360);
  47 |   await page.getByLabel("Description").fill("E2E lunch");
  48 |   await page.getByLabel("Amount").fill("60.00");
  49 |   await page.getByRole("button", { name: "Add expense" }).last().click();
> 50 |   await expect(page.getByText("E2E lunch")).toBeVisible();
     |                                             ^ Error: expect(locator).toBeVisible() failed
  51 | 
  52 |   await page.getByRole("button", { name: "Balances" }).click();
  53 |   await page.getByRole("button", { name: "Settle", exact: true }).click();
  54 |   await page.getByRole("button", { name: "Record settlement" }).click();
  55 |   await expect(page.getByText("Everyone's settled up")).toBeVisible();
  56 | });
```