# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-flow.spec.js >> register, invite a member, add an expense, and settle the balance
- Location: e2e\product-flow.spec.js:48:1

# Error details

```
Error: Expense creation failed.
Current URL: http://localhost:5173/groups/8
Visible page content:
BLNCR
EO
All groups
E2E Trip 1790877270627-621095
USD
Settle up
Add expense
Expenses
Balances
Activity
Members

No expenses yet

Add the first expense to start tracking who owes what.

Add expense
Description
Category
Food
Transport
Lodging
Shopping
Entertainment
Utilities
Health
Other
Amount
$
Paid by
You
E2E Member
Split type
Equal
Exact
Percent
Split between
EO
You
EM
E2E Member
Cancel
Add expense
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - generic [ref=f1e5]:
      - link "BLNCR BLNCR" [ref=f1e6] [cursor=pointer]:
        - /url: /dashboard
        - img "BLNCR" [ref=f1e7]
        - generic [ref=f1e8]: BLNCR
      - generic [ref=f1e9]:
        - button "Switch to dark theme" [ref=f1e10] [cursor=pointer]
        - button "Open account menu" [ref=f1e17]:
          - generic "E2E Owner" [ref=f1e18]: EO
  - main [ref=f1e21]:
    - generic [ref=f1e22]:
      - generic [ref=f1e23]:
        - link "All groups" [ref=f1e24] [cursor=pointer]:
          - /url: /dashboard
        - generic [ref=f1e27]:
          - generic [ref=f1e28]:
            - heading "E2E Trip 1790877270627-621095" [level=1] [ref=f1e29]
            - generic [ref=f1e30]: USD
          - generic [ref=f1e31]:
            - button "Settle up" [ref=f1e32] [cursor=pointer]
            - button "Add expense" [ref=f1e33] [cursor=pointer]
      - generic [ref=f1e36]:
        - button "Expenses" [ref=f1e37]
        - button "Balances" [ref=f1e40]
        - button "Activity" [ref=f1e43]
        - button "Members" [ref=f1e46]
      - generic [ref=f1e53]:
        - paragraph [ref=f1e54]: No expenses yet
        - paragraph [ref=f1e55]: Add the first expense to start tracking who owes what.
      - dialog [ref=f1e57]:
        - generic [ref=f1e58]:
          - heading "Add expense" [level=2] [ref=f1e59]
          - button "Close" [active] [ref=f1e60] [cursor=pointer]
        - generic [ref=f1e64]:
          - generic [ref=f1e65]:
            - generic [ref=f1e66]: Description
            - textbox "Description" [ref=f1e67]:
              - /placeholder: Dinner at Sultan's Dine
              - text: E2E lunch
          - generic [ref=f1e68]:
            - generic [ref=f1e69]: Category
            - combobox "Category" [ref=f1e70]:
              - option "Food"
              - option "Transport"
              - option "Lodging"
              - option "Shopping"
              - option "Entertainment"
              - option "Utilities"
              - option "Health"
              - option "Other" [selected]
          - generic [ref=f1e71]:
            - generic [ref=f1e72]:
              - generic [ref=f1e73]: Amount
              - generic [ref=f1e74]:
                - generic: $
                - spinbutton "Amount" [ref=f1e75]: "60.00"
            - generic [ref=f1e76]:
              - generic [ref=f1e77]: Paid by
              - combobox "Paid by" [ref=f1e78]:
                - option "You" [selected]
                - option "E2E Member"
          - generic [ref=f1e79]:
            - generic [ref=f1e80]: Split type
            - generic [ref=f1e81]:
              - button "Equal" [ref=f1e82]
              - button "Exact" [ref=f1e83]
              - button "Percent" [ref=f1e84]
          - generic [ref=f1e85]:
            - generic [ref=f1e86]: Split between
            - generic [ref=f1e88]:
              - generic [ref=f1e89]:
                - checkbox "Include E2E Owner in split" [checked] [ref=f1e90]
                - generic "E2E Owner" [ref=f1e91]: EO
                - generic [ref=f1e92]: You
              - generic [ref=f1e93]:
                - checkbox "Include E2E Member in split" [checked] [ref=f1e94]
                - generic "E2E Member" [ref=f1e95]: EM
                - generic [ref=f1e96]: E2E Member
          - generic [ref=f1e97]:
            - button "Cancel" [ref=f1e98] [cursor=pointer]
            - button "Add expense" [ref=f1e99] [cursor=pointer]
```

# Test source

```ts
  54  |   const ownerEmail = `blncr-owner-${suffix}@gmail.com`;
  55  |   const memberEmail = `blncr-member-${suffix}@gmail.com`;
  56  | 
  57  |   // 1. Register owner
  58  |   await register(page, "E2E Owner", ownerEmail);
  59  | 
  60  |   // 2. Create group
  61  |   await page.getByRole("button", { name: "New group" }).click();
  62  | 
  63  |   await page.getByLabel("Group name").fill(`E2E Trip ${suffix}`);
  64  | 
  65  |   await page.getByRole("button", { name: "Create group" }).click();
  66  | 
  67  |   const groupLink = page.getByRole("link", {
  68  |     name: new RegExp(`E2E Trip ${suffix}`),
  69  |   });
  70  | 
  71  |   await expect(groupLink).toBeVisible({ timeout: 15000 });
  72  | 
  73  |   await groupLink.click();
  74  | 
  75  |   // 3. Generate invitation
  76  |   await page.getByRole("button", { name: "Members" }).click();
  77  | 
  78  |   await page.getByRole("button", { name: "Invite member" }).click();
  79  | 
  80  |   await page.getByRole("button", { name: "Create invite link" }).click();
  81  | 
  82  |   const inviteUrl = await page
  83  |     .getByRole("textbox", { name: "Group invite link" })
  84  |     .inputValue();
  85  | 
  86  |   expect(inviteUrl).toBeTruthy();
  87  | 
  88  |   // 4. Register member in a separate browser context
  89  |   const memberContext = await browser.newContext();
  90  | 
  91  |   try {
  92  |     const memberPage = await memberContext.newPage();
  93  | 
  94  |     await register(memberPage, "E2E Member", memberEmail);
  95  | 
  96  |     await memberPage.goto(inviteUrl);
  97  | 
  98  |     await expect(memberPage).toHaveURL(/\/groups\/\d+$/, {
  99  |       timeout: 15000,
  100 |     });
  101 | 
  102 |     await expect(
  103 |       memberPage.getByRole("heading", {
  104 |         name: new RegExp(`E2E Trip ${suffix}`),
  105 |       })
  106 |     ).toBeVisible();
  107 | 
  108 |   } finally {
  109 |     await memberContext.close();
  110 |   }
  111 | 
  112 |   // 5. Reload group as owner
  113 |   await page.reload();
  114 | 
  115 |   await expect(
  116 |     page.getByRole("heading", {
  117 |       name: new RegExp(`E2E Trip ${suffix}`),
  118 |     })
  119 |   ).toBeVisible();
  120 | 
  121 |   // 6. Test responsive expense modal
  122 |   await page.setViewportSize({
  123 |     width: 360,
  124 |     height: 800,
  125 |   });
  126 | 
  127 |   await page.getByRole("button", { name: "Add expense" }).click();
  128 | 
  129 |   const expenseDialog = page.getByRole("dialog", {
  130 |     name: "Add expense",
  131 |   });
  132 | 
  133 |   await expect(expenseDialog).toBeVisible();
  134 | 
  135 |   const dialogBox = await expenseDialog.boundingBox();
  136 | 
  137 |   expect(dialogBox).not.toBeNull();
  138 |   expect(dialogBox.width).toBeLessThanOrEqual(360);
  139 | 
  140 |   // 7. Add expense
  141 |   await page.getByLabel("Description").fill("E2E lunch");
  142 | 
  143 |   await page.getByLabel("Amount").fill("60.00");
  144 | 
  145 |   await page.getByRole("button", { name: "Add expense" }).last().click();
  146 | 
  147 |   try {
  148 |     await expect(page.getByText("E2E lunch")).toBeVisible({
  149 |       timeout: 20000,
  150 |     });
  151 |   } catch {
  152 |     const pageContent = await page.locator("body").innerText();
  153 | 
> 154 |     throw new Error(
      |           ^ Error: Expense creation failed.
  155 |       `Expense creation failed.\n` +
  156 |       `Current URL: ${page.url()}\n` +
  157 |       `Visible page content:\n${pageContent}`
  158 |     );
  159 |   }
  160 | 
  161 |   // 8. Settle balance
  162 |   await page.getByRole("button", { name: "Balances" }).click();
  163 | 
  164 |   await page.getByRole("button", { name: "Settle", exact: true }).click();
  165 | 
  166 |   await page.getByRole("button", { name: "Record settlement" }).click();
  167 | 
  168 |   await expect(
  169 |     page.getByText("Everyone's settled up")
  170 |   ).toBeVisible({
  171 |     timeout: 15000,
  172 |   });
  173 | });
```