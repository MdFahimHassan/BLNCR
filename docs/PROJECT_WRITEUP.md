# BLNCR — Project Write-up

*Drop-in copy for the "Projects" page of [personal-portfolio-rho-lac-91.vercel.app](https://personal-portfolio-rho-lac-91.vercel.app/). Trim to whatever length the portfolio's card/detail layout needs — a short and a long version are both below.*

---

## Short version (project card)

**BLNCR — Group Expense Splitter**
A Splitwise-style expense splitter with a debt-simplification engine that reduces a group's tangled IOUs to the minimum number of payments needed to settle up. Full-stack: Spring Boot + PostgreSQL API, React + Tailwind frontend, JWT auth, Dockerized and deployed on Railway/Vercel with CI on every push.

**Stack:** Java 21 · Spring Boot · PostgreSQL · React · Tailwind · Docker · GitHub Actions
**Links:** [Live app](https://blncr-xi.vercel.app/) · [API](https://blncr-production.up.railway.app/) · [Source](https://github.com/MdFahimHassan/BLNCR)

---

## Long version (project detail page)

### What it is

BLNCR is a full-stack group-expense-splitting app — think Splitwise. Users create groups, log shared expenses with flexible split rules (equal, exact amount, or percentage), and see a running balance of who owes whom. What sets it apart from a basic CRUD tracker is the **debt-simplification engine**: instead of just listing every pairwise debt, BLNCR computes the smallest possible set of payments that zeroes the whole group out — the same class of problem used in real settlement/netting systems.

### Why I built it

I wanted a first portfolio project with genuine algorithmic depth rather than another to-do-list clone — something that gives a technical interviewer a real thread to pull on (rounding-safe money math, a graph-style optimization problem, a layered backend that's actually tested). Expense splitting turned out to be a good vehicle: the domain is simple enough to explain in one sentence, but correct implementations require care in at least three separate places.

### How it works

- **Split math in integer cents, not floating point.** Every amount is a `BigDecimal`, and split calculations convert to integer cents before dividing, so `$100 ÷ 3` doesn't produce a rounding-error bug. Leftover cents are assigned by the largest-remainder method, so the distribution is deterministic and always sums exactly to the original total.
- **Debt simplification.** Given the group's net balances, a greedy algorithm repeatedly settles the largest creditor against the largest debtor until everyone is at zero. True minimum-transaction netting is NP-hard in general, so this is a heuristic — but it's the standard, interview-relevant approach and produces a short, clean payment list in practice.
- **Layered backend.** `controller → service → repository`, with the split/balance logic isolated in plain service classes that don't know about HTTP or the database — so the core algorithms are unit-testable without a running Spring context.
- **Auth.** Stateless JWT, custom filter chain, BCrypt password hashing.
- **Frontend.** React + Tailwind SPA with a deliberate "ledger" visual identity — a dark UI, monospaced tabular figures for every amount so numbers align like a real ledger, and a signature lime accent reserved only for primary actions.

### Engineering practices

- **Automated tests** at every layer: JUnit + Mockito service tests (the split/balance/debt-simplification logic gets the most thorough coverage, since it's the highest-value code to get right), `@DataJpaTest` repository tests against H2, and a full `@SpringBootTest` + MockMvc integration test that walks the entire register → group → expense → balance → settle → activity flow with real JWT auth.
- **CI/CD.** GitHub Actions runs the full test suite and builds both the backend jar/Docker image and the frontend bundle on every push, so a broken build never reaches deploy.
- **Infrastructure as config, not hardcoding.** Docker + Docker Compose for a one-command local environment (backend + Postgres, no local installs needed); Flyway for versioned schema migrations instead of letting Hibernate auto-alter the schema; every secret (`JWT_SECRET`, DB credentials, CORS origins) supplied via environment variables with no working fallback baked into the code.
- **Deployed and live**, not just running locally: Railway (API + managed Postgres) and Vercel (frontend), verified end-to-end against the real deployed stack, not just `localhost`.

### What I'd add next

Recurring expenses, multi-currency support, receipt image uploads, and category breakdowns with charts are the scoped-out v2 features — held back deliberately so v1 stayed focused on the algorithmic core (splits, balances, debt simplification) rather than spreading effort across a longer feature list.

---

*Full build log, including the real deployment bugs hit and fixed along the way (a Spring Boot 4 Flyway auto-configuration gotcha, a committed `node_modules` breaking the Vercel build, and a Vercel env-var type mistake), is in [`Progress.md`](../Progress.md) in the repo.*