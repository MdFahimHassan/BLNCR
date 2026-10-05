// Generates the README screenshots (docs/screenshots/*.png) and a demo recording (docs/demo.webm).
//
// It seeds a realistic group through the REST API (fast and deterministic), then signs the
// browser in by writing the token to localStorage, so every shot shows the same believable data.
//
//   1. Start the backend:   docker compose up -d --build backend     (from the repo root)
//   2. From frontend/:      npx playwright test -c playwright.capture.config.js
//
// Each screenshot is independent: if one step fails (say a label changed) it is skipped with a
// warning and the rest still render. Wait about a minute between runs; registration is rate-limited.
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const API = process.env.VITE_API_BASE_URL ?? "http://localhost:9090";
const DOCS = path.resolve(process.cwd(), "..", "docs");
const SHOTS = path.join(DOCS, "screenshots");
const GROUP_NAME = "Cox's Bazar Trip";
const PASSWORD = "capture-demo-pass-123";

// ---------- API helpers ----------

async function call(request, method, url, { data, token, headers } = {}) {
  const response = await request.fetch(`${API}${url}`, {
    method,
    data,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
  });
  if (!response.ok()) {
    throw new Error(`${method} ${url} -> ${response.status()} ${await response.text()}`);
  }
  return response.status() === 204 ? null : response.json();
}

async function registerUser(request, name, suffix) {
  const email = `${name.toLowerCase()}.${suffix}@gmail.com`;
  const auth = await call(request, "POST", "/api/auth/register", {
    data: { name, email, password: PASSWORD },
  });
  return { id: auth.userId, name, email, token: auth.token };
}

function expense(description, amount, paidBy, category, members, splitType = "EQUAL", values = {}) {
  return {
    description,
    amount,
    paidByUserId: paidBy.id,
    splitType,
    category,
    splits: members.map((m) => ({ userId: m.id, value: values[m.id] ?? null })),
  };
}

async function addExpense(request, groupId, owner, body) {
  return call(request, "POST", `/api/groups/${groupId}/expenses`, {
    token: owner.token,
    data: body,
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
}

/** Registers `names` (first one owns the group) and joins them all via invite links. */
async function seedGroup(request, names, suffix) {
  const users = [];
  for (const name of names) users.push(await registerUser(request, name, suffix));
  const [owner, ...others] = users;

  const group = await call(request, "POST", "/api/groups", {
    token: owner.token,
    data: { name: GROUP_NAME, currency: "BDT" },
  });
  for (const member of others) {
    const invite = await call(request, "POST", `/api/groups/${group.id}/invitations`, {
      token: owner.token,
    });
    await call(request, "POST", `/api/invitations/${encodeURIComponent(invite.token)}/accept`, {
      token: member.token,
    });
  }
  return { group, users, owner };
}

async function seedFullTrip(request, suffix) {
  const { group, users, owner } = await seedGroup(
    request,
    ["Fahim", "Nadia", "Rafi", "Tania"],
    suffix
  );
  const [fahim, nadia, rafi, tania] = users;
  const all = users;

  const add = (body) => addExpense(request, group.id, owner, body);
  await add(expense("Beachfront hotel, 2 nights", "18000.00", fahim, "LODGING", all));
  await add(expense("Microbus rental", "6400.00", rafi, "TRANSPORT", all));
  await add(expense("Seafood dinner", "5200.00", nadia, "FOOD", all));
  await add(expense("Beach activities", "3000.00", tania, "ENTERTAINMENT", all));
  await add(expense("Breakfast", "1800.00", fahim, "FOOD", [fahim, nadia, rafi]));
  await add(
    expense("Souvenirs", "2500.00", nadia, "SHOPPING", all, "EXACT", {
      [fahim.id]: 500,
      [nadia.id]: 1000,
      [rafi.id]: 500,
      [tania.id]: 500,
    })
  );

  // One settlement so the activity feed shows both kinds of entries (Rafi is a party to it).
  await call(request, "POST", `/api/groups/${group.id}/settlements`, {
    token: rafi.token,
    data: { fromUserId: rafi.id, toUserId: nadia.id, amount: "500.00" },
  });
  return { group, owner };
}

// ---------- browser helpers ----------

async function signedInContext(browser, owner, options = {}) {
  const context = await browser.newContext({
    colorScheme: "dark",
    deviceScaleFactor: 2,
    ...options,
  });
  await context.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("blncr_token", token);
      localStorage.setItem("blncr_user", JSON.stringify(user));
    },
    { token: owner.token, user: { id: owner.id, name: owner.name, email: owner.email } }
  );
  return context;
}

async function shoot(page, file, prepare) {
  try {
    if (prepare) await prepare();
    await page.waitForTimeout(800); // let transitions finish
    await page.screenshot({ path: path.join(SHOTS, file) });
    console.log(`saved docs/screenshots/${file}`);
  } catch (error) {
    console.warn(`SKIPPED ${file}: ${String(error.message).split("\n")[0]}`);
  }
}

const groupLink = (page) => page.getByRole("link", { name: new RegExp(GROUP_NAME) });
const tab = (page, name) => page.getByRole("button", { name, exact: true });

// ---------- screenshots ----------

test("capture README screenshots", async ({ browser, request }) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const suffix = Date.now().toString(36);
  const { owner } = await seedFullTrip(request, suffix);

  // Landing page (signed out)
  const publicContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
    deviceScaleFactor: 2,
  });
  const publicPage = await publicContext.newPage();
  await publicPage.goto("/");
  await shoot(publicPage, "00-landing.png", () => publicPage.waitForTimeout(1500));
  await publicContext.close();

  // Desktop, signed in
  const context = await signedInContext(browser, owner, {
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("/dashboard");
  await shoot(page, "01-dashboard.png", () => expect(groupLink(page)).toBeVisible());

  await groupLink(page).click();
  await shoot(page, "02-expenses.png", () => expect(page.getByText("Seafood dinner")).toBeVisible());
  await shoot(page, "03-balances.png", async () => {
    await tab(page, "Balances").click();
    await expect(page.getByRole("button", { name: "Settle", exact: true }).first()).toBeVisible();
  });
  await shoot(page, "04-activity.png", () => tab(page, "Activity").click());
  await shoot(page, "05-members.png", () => tab(page, "Members").click());
  await context.close();

  // Mobile, signed in
  const mobile = await signedInContext(browser, owner, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const phone = await mobile.newPage();
  await phone.goto("/dashboard");
  await expect(groupLink(phone)).toBeVisible();
  await groupLink(phone).click();
  await shoot(phone, "06-mobile-group.png", () => expect(phone.getByText("Seafood dinner")).toBeVisible());
  await shoot(phone, "07-mobile-add-expense.png", async () => {
    await phone.getByRole("button", { name: "Add expense" }).click();
    await expect(phone.getByRole("dialog", { name: "Add expense" })).toBeVisible();
  });
  await mobile.close();
});

// ---------- demo recording ----------

test("record demo walkthrough", async ({ browser, request }) => {
  const suffix = `d${Date.now().toString(36)}`;
  const { group, owner } = await seedGroup(request, ["Fahim", "Nadia", "Rafi"], suffix);
  // A couple of expenses first so the balances tab has something to simplify.
  const members = await call(request, "GET", `/api/groups/${group.id}/members`, {
    token: owner.token,
  });
  const everyone = members.map((m) => ({ id: m.userId }));
  await addExpense(request, group.id, owner, expense("Hotel", "9000.00", owner, "LODGING", everyone));
  await addExpense(
    request,
    group.id,
    owner,
    expense("Taxi", "1500.00", { id: members[1].userId }, "TRANSPORT", everyone)
  );

  const videoDir = path.join(DOCS, ".video-tmp");
  fs.rmSync(videoDir, { recursive: true, force: true });
  const context = await signedInContext(browser, owner, {
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const pause = (ms) => page.waitForTimeout(ms);

  await page.goto("/dashboard");
  await expect(groupLink(page)).toBeVisible();
  await pause(1500);
  await groupLink(page).click();
  await expect(page.getByText("Hotel")).toBeVisible();
  await pause(1500);

  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByLabel("Description").pressSequentially("Beach dinner", { delay: 60 });
  await page.getByLabel("Amount").pressSequentially("2400", { delay: 80 });
  await pause(900);
  await page.getByRole("button", { name: "Add expense" }).last().click();
  await expect(page.getByText("Beach dinner")).toBeVisible({ timeout: 20_000 });
  await pause(1500);

  await tab(page, "Balances").click();
  await expect(page.getByRole("button", { name: "Settle", exact: true }).first()).toBeVisible();
  await pause(2500);
  await page.getByRole("button", { name: "Settle", exact: true }).first().click();
  await pause(1200);
  await page.getByRole("button", { name: "Record settlement" }).click();
  await pause(2500);

  const video = page.video();
  await context.close(); // flushes the recording
  const target = path.join(DOCS, "demo.webm");
  fs.mkdirSync(DOCS, { recursive: true });
  fs.copyFileSync(await video.path(), target);
  fs.rmSync(videoDir, { recursive: true, force: true });

  console.log("\nsaved docs/demo.webm. Convert it to the GIF the README embeds:");
  console.log(
    '  ffmpeg -i docs/demo.webm -vf "fps=12,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" docs/demo.gif\n'
  );
});