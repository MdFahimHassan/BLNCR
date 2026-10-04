# BLNCR — Project Write-up

*Drop-in copy for the "Projects" page of [personal-portfolio-rho-lac-91.vercel.app](https://personal-portfolio-rho-lac-91.vercel.app/). Trim to whatever length the portfolio's card/detail layout needs — a short and a long version are both below.*

---

## Short version (project card)

**BLNCR — Group Expense Splitter**
A Splitwise-style expense splitter with a greedy debt-simplification heuristic that turns a group's tangled IOUs into a compact payment plan. It often reduces the payment count but does not guarantee the mathematical minimum. Full-stack: Spring Boot + PostgreSQL API, React + Tailwind frontend, JWT auth, Dockerized and deployed on Railway/Vercel with CI on every push.

**Stack:** Java 21 · Spring Boot · PostgreSQL · React · Tailwind · Docker · GitHub Actions · Testcontainers · Playwright
**Links:** [Live app](https://blncr-xi.vercel.app/) · [API](https://blncr-production.up.railway.app/) · [Source](https://github.com/MdFahimHassan/BLNCR)

The SPA keeps its bearer JWT in `localStorage`. This is a deliberate trade-off: the restrictive API CSP and absence of third-party scripts reduce script-injection exposure, but a successful XSS could still read browser storage. Login throttling and revocation are in-memory and are therefore single-instance protections, not shared controls for horizontal deployments.

---

## Long version (project detail page)

### What it is

BLNCR is a full-stack group-expense-splitting app — think Splitwise. Users create groups, log shared expenses with flexible split rules (equal, exact amount, or percentage), and see a running balance of who owes whom. What sets it apart from a basic CRUD tracker is the **debt-simplification engine**: instead of listing every pairwise debt, BLNCR uses a greedy heuristic to produce a compact payment plan that zeroes the whole group out. The heuristic is useful in practice but does not guarantee the globally smallest plan.

### Why I built it

I wanted a first portfolio project with genuine algorithmic depth rather than another to-do-list clone — something that gives a technical interviewer a real thread to pull on (rounding-safe money math, a graph-style optimization problem, a layered backend that's actually tested). Expense splitting turned out to be a good vehicle: the domain is simple enough to explain in one sentence, but correct implementations require care in at least three separate places.

### How it works

- **Split math in integer cents, not floating point.** Every amount is a `BigDecimal`, and split calculations convert to integer cents before dividing, so `$100 ÷ 3` doesn't produce a rounding-error bug. Leftover cents are assigned by the largest-remainder method, so the distribution is deterministic and always sums exactly to the original total.
- **Debt simplification.** Given the group's net balances, a greedy algorithm repeatedly settles the largest creditor against the largest debtor until everyone is at zero. True minimum-transaction netting is NP-hard in general, so this is a heuristic — but it's the standard, interview-relevant approach and produces a short, clean payment list in practice.
- **Layered backend.** `controller → service → repository`, with the split/balance logic isolated in plain service classes that don't know about HTTP or the database — so the core algorithms are unit-testable without a running Spring context.
- **Auth.** Stateless JWT, custom filter chain, BCrypt password hashing.
- **Real group management, not just a ledger.** Single-use invite links (stored only as SHA-256 hashes), owner/admin/member roles with ownership transfer, and expense edit/delete restricted to the creator or an admin. Leaving a group, removing someone, or deleting an account is blocked while a balance is unsettled, because settlements can only be recorded between active members and the debt would otherwise be stranded.
- **Safe writes and honest time.** Expense creation takes an idempotency key so a retry can't double-post, constraint races surface as `409` rather than `500`, and every timestamp is a UTC instant stored as `TIMESTAMPTZ` so each viewer sees their own local time (an early bug here: zone-less timestamps made server time display as local time).
- **Frontend.** React + Tailwind SPA with a deliberate "ledger" visual identity — a dark UI, monospaced tabular figures for every amount so numbers align like a real ledger, and a signature lime accent reserved only for primary actions.

### Engineering practices

- **Automated tests** at every layer: JUnit + Mockito service tests (the split/balance/debt-simplification logic gets the most thorough coverage, since it's the highest-value code to get right), `@DataJpaTest` repository tests, a full `@SpringBootTest` + MockMvc flow with real JWT auth, a Testcontainers test that applies every Flyway migration to a real PostgreSQL and checks the constraints actually fire, Vitest component tests on the frontend, and a Playwright test that drives the real UI through register, invite, add expense and settle.
- **CI/CD.** GitHub Actions runs backend tests, frontend lint and tests with coverage, the Docker build, and the browser end-to-end flow against the containerized API on every push, so a broken build never reaches deploy.
- **Infrastructure as config, not hardcoding.** Docker + Docker Compose for a one-command local environment (backend + Postgres, no local installs needed); Flyway for versioned schema migrations instead of letting Hibernate auto-alter the schema; every secret (`JWT_SECRET`, DB credentials, CORS origins) supplied via environment variables with no working fallback baked into the code.
- **Observability.** Health and readiness probes, an `X-Request-ID` on every response that also appears in structured JSON logs, opt-in Sentry error reporting, and OpenAPI docs.
- **Deployed and live**, not just running locally: Railway (API + managed Postgres) and Vercel (frontend), verified end-to-end against the real deployed stack, not just `localhost`.

### Known limits and what I'd do next

Rate limiting and token revocation are in-memory (single instance), the JWT lives in `localStorage` rather than an `HttpOnly` cookie, and list endpoints are paged in the browser rather than the server. Next on the list: server-side pagination and CSV export, refresh tokens with cookie auth and Redis-backed throttling, settlement reversal, and an exact debt-simplification solver for small groups with the greedy heuristic as the fallback. The full list is in the README.