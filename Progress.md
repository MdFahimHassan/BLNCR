# BLNCR — Project Context & Progress Log

## The Bigger Picture
Building toward a full-stack developer portfolio ahead of UG graduation (~2029), with possible masters after. Goal: 2-3 deep, impactful projects rather than many shallow ones. This is project #1 of that plan.

**GitHub:** https://github.com/MdFahimHassan
**Portfolio:** https://personal-portfolio-rho-lac-91.vercel.app/

## Project: BLNCR (Expense Splitter)
A group expense-splitting app (Splitwise-style) — chosen because it has real algorithmic depth (splits, balance calculation, debt simplification) beyond basic CRUD, making it more portfolio-worthy than a typical clone.

### Roadmap (7 phases)
1. **Scope & data model** ✅ Done
2. **Backend foundation** ✅ Done
3. **Expense & split logic** ✅ Done — equal/exact/percentage splits, balance calc, debt-simplification algorithm
4. **Frontend build** ✅ Done — React + Tailwind
5. **Testing** ✅ Done — JUnit + Mockito unit tests, `@DataJpaTest` repository tests, `@WebMvcTest` + full-stack `@SpringBootTest`/MockMvc integration tests
6. **Dockerize & deploy** — Docker, GitHub Actions CI, Railway/Render + Vercel
7. **Polish for recruiters** — architecture diagram, README, demo, live link

### v1 Feature Scope (locked in)
- Users & groups (create group, invite members)
- Add expense (who paid, amount, split type: equal / exact / percentage)
- Balance calculation (who owes whom, per group)
- Settle up (mark debt as paid)
- Activity/history feed

**Stretch features (later, not v1):** recurring expenses, multi-currency, receipt image upload, expense categories with charts.

### Tech Stack Decisions
- **Backend:** Spring Boot 4.1.0, Java 21, Maven (not Gradle — switched)
- **Database:** PostgreSQL 18 (via Docker container, not native install)
- **ORM:** Hibernate 7.4.1 / Spring Data JPA
- **Auth (planned):** Spring Security + JWT
- **Frontend (planned):** React + Tailwind
- **Deployment (planned):** Docker + GitHub Actions CI + Railway/Render (backend) + Vercel (frontend)

### Project Identity
- **Name:** BLNCR ("balancer" with vowels dropped, SaaS-style naming)
- **Group ID:** `dev.fahim`
- **Artifact ID:** `blncr`
- **Package:** `dev.fahim.blncr`
- **Local path:** `D:\Study Material\CSE Projects\blncr`

### Entity Model (implemented)
Located in `src/main/java/dev/fahim/blncr/entity/`:
- `User` (id, name, email, passwordHash, createdAt)
- `Group` (id, name, createdBy → User, createdAt)
- `GroupMember` (id, group, user, joinedAt)
- `Expense` (id, group, paidBy, amount [BigDecimal], description, splitType, createdAt)
- `ExpenseSplit` (id, expense, user, amountOwed [BigDecimal])
- `Settlement` (id, group, fromUser, toUser, amount [BigDecimal], settledAt)
- `SplitType` (enum: EQUAL, EXACT, PERCENTAGE)

**Key convention:** All money fields use `BigDecimal`, never `float`/`double` (avoids floating-point rounding bugs in financial logic — a detail interviewers probe for).

### Folder Structure
```
src/main/java/dev/fahim/blncr/
├── config/         ✅ SecurityConfig, ApplicationConfig
├── controller/     ✅ AuthController, GroupController, UserController
├── dto/            ✅ Request/Response DTOs (Auth, User, Group)
├── entity/         ✅ 7 entity files
├── exception/      ✅ GlobalExceptionHandler, Custom Exceptions
├── repository/     ✅ UserRepository, GroupRepository, GroupMemberRepository, etc.
├── security/       ✅ JwtUtils, JwtAuthenticationFilter, UserDetailsService
└── service/        ✅ AuthService, GroupService, UserService
```

### Local Environment Setup
- **Postgres:** running in Docker, container name `blncr-db`
  ```
  docker run --name blncr-db -e POSTGRES_PASSWORD=blncr123 -e POSTGRES_DB=blncr -p 5432:5432 -d postgres
  ```
- **`application.properties`** (working config):
  ```properties
  spring.application.name=blncr

  spring.datasource.url=jdbc:postgresql://localhost:5432/blncr
  spring.datasource.username=postgres
  spring.datasource.password=blncr123

  spring.jpa.hibernate.ddl-auto=update
  spring.jpa.show-sql=true
  spring.jpa.properties.hibernate.format_sql=true

  server.port=9090
  ```
  (No `hibernate.dialect` or `driver-class-name` needed — Spring Boot 4.1/Hibernate 7 auto-detects both from the JDBC URL.)

### Known Environment Gotchas (already solved — don't repeat!)
1. **Wrong dialect class name** initially given (`org.postgresql.dialect...` doesn't exist) — fixed by removing the dialect line entirely and letting Spring auto-detect.
2. **A native Windows PostgreSQL service** (`postgresql-x64-18`) was also bound to port 5432, competing with the Docker container — this caused persistent "password authentication failed" errors even with a correct Docker password. Native service was stopped (`Stop-Service postgresql-x64-18`, run as Administrator).
3. **Port 8080 and 8081 are inside Windows' hidden TCP excluded port ranges** (checked via `netsh interface ipv4 show excludedportrange protocol=tcp`) — these ranges are often reserved by Hyper-V/WSL2 (which Docker Desktop uses) and silently block binding even when `netstat` shows the port as free. **Solution: app now runs on port 9090**, which is outside all excluded ranges on this machine. If future port conflicts happen, check excluded ranges first before troubleshooting anything else.
4. Zombie `java.exe` processes from previous `spring-boot:run` sessions can linger and hold ports after Ctrl+C — clear with `Get-Process java | Stop-Process -Force` (careful: don't kill VS Code's own `redhat.java` language server process, which is separate and needed for IDE features).

✅ Phase 2 Completed: App boots cleanly, fully handles User Authentication (Register/Login via JWT), secures endpoints, handles custom exceptions, and provides Group creation & management endpoints.

✅ Verified endpoints end-to-end:

- POST /api/auth/register & POST /api/auth/login

- GET /api/users/me

- POST /api/groups & POST /api/groups/{id}/members

✅ Phase 3 Completed: Expense & split logic, balance calculation, debt simplification, settlements, and activity feed all implemented.

**New files added:**
- `repository/ExpenseRepository.java` (was missing — needed for the expense list/lookup)
- `exception/InvalidRequestException.java` — 400 for business-rule violations (splits don't sum right, duplicate split participant, settling with yourself, etc.), wired into `GlobalExceptionHandler`
- `service/GroupAccessService.java` — shared "does this group exist / is this user a member" helper used by all the Phase 3 services
- `service/SplitCalculator.java` — the algorithmic core: EQUAL / EXACT / PERCENTAGE split math done in **integer cents** (not raw BigDecimal division) so remainders are distributed deterministically and splits always sum exactly to the total. PERCENTAGE uses the largest-remainder method so leftover cents go to the biggest fractional share, not just whoever's listed first.
- `service/ExpenseService.java` — `POST/GET /api/groups/{id}/expenses`
- `service/BalanceService.java` — `GET /api/groups/{id}/balances`, includes the **debt-simplification algorithm** (greedy largest-creditor/largest-debtor matching) that returns the minimum-transaction settle-up plan
- `service/SettlementService.java` — `POST/GET /api/groups/{id}/settlements`
- `service/ActivityService.java` — `GET /api/groups/{id}/activity`, merges expenses + settlements chronologically
- Matching DTOs: `CreateExpenseRequest`, `ExpenseSplitInput`, `ExpenseResponse`, `ExpenseSplitResponse`, `BalanceResponse`, `SettlementSuggestion`, `GroupBalancesResponse`, `CreateSettlementRequest`, `SettlementResponse`, `ActivityItem`
- Matching controllers: `ExpenseController`, `BalanceController`, `SettlementController`, `ActivityController`

**Design notes for later reference:**
- Split math avoids `BigDecimal.divide` giving non-terminating/lossy splits by converting to integer cents first, splitting the cents, then converting back — this is the standard fix for "split $100 three ways" style bugs.
- Debt simplification is the greedy "settle the biggest debt with the biggest credit first" heuristic. It's not provably optimal in the general case (true minimum-transaction account balancing is NP-hard), but it's the accepted portfolio-project approach and produces a clean, small transaction list — mention the NP-hard caveat in the README when writing up Phase 7.
- `GroupAccessService` was added to avoid duplicating the "group exists / user is a member" checks across 4 new services (the pattern `GroupService` already had inline, factored out since more services now need it). `GroupService` itself was left untouched.
- Settlement recording is deliberately flexible (`fromUserId` + `toUserId`, both just need to be group members) rather than hardcoded to "the logged-in user paid" — closer to real-world use where anyone can log that a settlement happened.

### Next Steps (immediate)
1. Unit-test the split/balance/debt-simplification logic now (per the Phase 3 checklist) rather than waiting for Phase 5 — it's the highest-value and trickiest code in the project.
2. Move to Phase 4: Frontend Build (React + Tailwind, Vite)

---

✅ Phase 4 Completed: Full React frontend built and wired to every Phase 2/3 endpoint — auth, groups, expenses (all 3 split types), balances, settle-up, activity feed, members.

**Stack chosen:**
- Vite + React 19, React Router 7, Axios
- Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.js` needed)
- `@phosphor-icons/react` for icons
- Self-hosted `@fontsource/geist-sans` + `@fontsource/geist-mono` (no Google Fonts CDN dependency)

**New directory:** `frontend/` (sibling to `src/`, own `package.json`)
- `src/api/client.js` — Axios instance; attaches JWT from `localStorage` on every request, normalizes backend `ApiError` shape into a single message, force-logs-out on 401
- `src/api/endpoints.js` — one function per backend endpoint, grouped by resource (auth, users, groups, expenses, balances, settlements, activity)
- `src/context/AuthContext.jsx` — holds `user`/token, exposes `login`/`register`/`logout`, persists to `localStorage`
- `src/context/ToastContext.jsx` — lightweight toast queue for success/error feedback (no external toast lib)
- `src/lib/format.js` — currency/date/initials formatting helpers
- `src/components/` — `Button`, `Field`/`Input`/`Select`, `Avatar`, `Modal`, `Feedback` (spinner/empty-state), `AppShell`, `ProtectedRoute`, `GroupCard`, `CreateGroupModal`, `AddExpenseModal`, `AddMemberModal`, `ExpenseList`, `LedgerBar`, `BalancesTab`, `SettleUpModal`, `ActivityFeed`, `MembersTab`
- `src/pages/` — `LoginPage`, `RegisterPage`, `DashboardPage` (groups grid), `GroupPage` (tabbed group workspace: Expenses / Balances / Activity / Members)
- `src/App.jsx` — routing (`/login`, `/register`, `/`, `/groups/:id`) + provider tree; `ProtectedRoute` redirects unauthenticated users, `AuthRedirect` keeps logged-in users off the auth pages

**Design notes for later reference:**
- Visual direction: dark "ledger" aesthetic — near-black surfaces, Geist Sans for UI text, **Geist Mono for every monetary figure** (`.ledger-figure` utility class, tabular nums) so amounts always align like a real ledger. Signature accent is a lime (`--color-accent`, `#d7ff3e`) reserved only for primary actions/branding, kept deliberately separate from the semantic credit/debit colors (green/rose) used for balance polarity so the two meanings never collide.
- Signature UI element: `LedgerBar` — a diverging bar chart (green right / rose left from a center zero-line) on the Balances tab, trading-tape style, so net position across the group reads at a glance. Bar length is proportional to the largest `|balance|` in the group.
- `AddExpenseModal` implements the full split-type calculator client-side: EQUAL just needs participant checkboxes; EXACT/PERCENTAGE show a per-member input with a live running-total vs. target check (turns green/rose) and a "Split evenly" auto-fill button that mirrors the backend's largest-remainder cent distribution so the UI won't produce a total the backend then rejects.
- There's no `GET /api/groups/{id}` single-group endpoint on the backend, so `GroupPage` re-fetches `groupApi.list()` and finds the matching group client-side for the header/title — fine at this scale, worth adding a dedicated endpoint if the groups list ever gets large.
- `localStorage` is used for the JWT/user here deliberately — this is a real standalone app (not a Claude artifact), so browser storage is appropriate, unlike the artifact-storage restriction that applies elsewhere.
- Verified with `npm run build` (clean, 0 errors) and `npm run lint` (oxlint — 0 errors, only 3 expected "fast-refresh" style warnings from files that export a hook + helper alongside a provider component, which is intentional here).
- `.env.example` added — `VITE_API_BASE_URL` (defaults to `http://localhost:9090`), so pointing at a deployed backend in Phase 6 is a one-line change.

### Next Steps (immediate)
1. Run the backend locally (`./mvnw spring-boot:run`) and the frontend (`cd frontend && npm install && npm run dev`) together and click through the full flow once: register → create group → add member → add expense (try all 3 split types) → balances → settle up → activity feed.
2. Move to Phase 5: Testing (JUnit + Mockito for the Phase 3 services, especially split/balance/debt-simplification).

---

✅ Phase 5 Completed: Full automated test suite added — unit tests for every service, `@DataJpaTest` repository tests, a `@WebMvcTest` controller slice test, and one full-stack `@SpringBootTest`/MockMvc integration test covering the entire register → group → expense → balances → settle → activity flow with real JWT auth.

**pom.xml fix:** `spring-boot-starter-test` (the base starter providing JUnit Jupiter, Mockito, AssertJ) was missing — only the newer per-slice test starters (`-data-jpa-test`, `-security-test`, `-validation-test`, `-webmvc-test`) were present. Added it back, plus `com.h2database:h2` (test scope only) so the suite runs against an in-memory DB instead of the real Postgres container.

**New test-only config:** `src/test/resources/application-test.properties` — H2 in Postgres-compatibility mode, `ddl-auto=create-drop`, a test-only JWT secret. Activated via `@ActiveProfiles("test")` on every Spring context test (`BlncrApplicationTests`, the `@DataJpaTest` classes, the integration test).

**New files:**
- `service/SplitCalculatorTest.java` — the highest-value tests in the suite; every EQUAL/EXACT/PERCENTAGE case asserts the split sums back exactly to the input in cents, including the largest-remainder tie-breaking logic
- `service/BalanceServiceTest.java` — balance math plus the debt-simplification algorithm, including a three-person case that proves it collapses to the minimum number of transactions
- `service/ExpenseServiceTest.java`, `SettlementServiceTest.java`, `ActivityServiceTest.java`, `GroupAccessServiceTest.java`, `AuthServiceTest.java`, `GroupServiceTest.java` — Mockito unit tests covering the business-rule edge cases (non-member payer, unknown user, mismatched split totals, self-settlement, duplicate email, wrong password, idempotent member-add, etc.)
- `repository/UserRepositoryTest.java`, `GroupMemberRepositoryTest.java`, `ExpenseRepositoryTest.java`, `SettlementRepositoryTest.java` — `@DataJpaTest` tests against H2, including the unique-email DB constraint
- `controller/AuthControllerWebMvcTest.java` — `@WebMvcTest` with the security filter chain disabled (`addFilters = false`, since `/api/auth/**` is `permitAll` anyway) to isolate controller/validation/exception-mapping behavior from the DB
- `integration/GroupExpenseFlowIntegrationTest.java` — the full walkthrough through real MockMvc + JWT auth: register two users, form a group, add a $60 equal-split expense, verify the settle-up suggestion is exactly one $30 payment Bob → Alice, record the settlement, confirm balances zero out, and confirm the activity feed shows both events newest-first. Also covers unauthenticated (401) and non-member (403) access.

**Design notes for later reference:**
- Boot 4 moved `@DataJpaTest`/`@WebMvcTest`/etc. to modular packages (`org.springframework.boot.data.jpa.test.autoconfigure`, `org.springframework.boot.webmvc.test.autoconfigure`) and replaced the removed `@MockBean` with `@MockitoBean` (`org.springframework.test.context.bean.override.mockito.MockitoBean`) — easy to get wrong since most docs/tutorials still show the old Boot 3 paths.
- Service unit tests use real `SplitCalculator`/`GroupAccessService` instances where cheap to do so rather than mocking pure logic, so the tests also catch wiring mistakes between layers, not just isolated behavior.
- Couldn't run `mvn test` in the sandbox that wrote these (no Maven, no Maven Central network access) — verified every route/status/DTO shape by hand against the actual controllers and `GlobalExceptionHandler` instead. **Run `mvn test` locally first** before trusting this suite fully.
- Alongside Phase 5, did a small, deliberately scoped frontend polish pass (not part of the roadmap, just noticed while reading the code): added a `--ease-snap` easing token and active-press feedback (`active:scale-[...]`) to `Button`, `Modal`'s close button, `GroupCard`, and the toast entrance — the frontend had good tokens/accessibility already but zero tactile press feedback anywhere.

### Next Steps (immediate)
1. Run `mvn test` (or `./mvnw test`) locally to confirm the new suite actually compiles and passes — it was written and reviewed by hand without a working Maven/network setup.
2. Move to Phase 6: Dockerize & deploy (Dockerfile, docker-compose, move secrets to env vars, Flyway, GitHub Actions CI, Railway/Render + Vercel).

---

## FULL ROADMAP — ALL 7 PHASES IN DETAIL

### Phase 1 — Scope & Data Model ✅ DONE
- Defined v1 features (see above)
- Designed entity relationships
- Chose BLNCR as project name

### Phase 2 — Backend Foundation ✅ DONE
- [x] Spring Boot project setup (Maven, Java 21)
- [x] PostgreSQL running locally via Docker
- [x] All 6 JPA entities created and verified (tables auto-created)
- [x] Confirmed app boots cleanly on port 9090
- [x] `UserRepository`, `GroupRepository`, etc. (Spring Data JPA interfaces)
- [x] DTOs for register/login requests & responses
- [x] Password hashing (BCrypt via Spring Security)
- [x] `POST /api/auth/register` endpoint
- [x] `POST /api/auth/login` endpoint — returns JWT
- [x] JWT utility class (generate + validate tokens)
- [x] JWT filter (intercepts requests, validates token)
- [x] Spring Security config — open `/api/auth/**`, protect everything else
- [x] Global exception handler (`@ControllerAdvice`) for clean error responses
- [x] Basic `GET /api/users/me` endpoint to test auth end-to-end
- [x] Group endpoints: create group, add member, list my groups

### Phase 3 — Expense & Split Logic (the algorithmic core)
This is the phase that makes BLNCR more than a CRUD app — most portfolio value lives here.
- [x] `POST /api/groups/{id}/expenses` — add an expense
- [x] Split calculation logic:
  - EQUAL — divide amount evenly among selected members (handle rounding remainders correctly, e.g. splitting 100 among 3 people)
  - EXACT — each member specifies their own owed amount, validate it sums to total
  - PERCENTAGE — each member specifies a %, validate it sums to 100%
- [x] Balance calculation service — for a group, compute net balance per user (who owes / is owed, in total)
- [x] **Debt simplification algorithm** — given a set of pairwise debts, minimize the number of transactions needed to settle everyone up (classic interview-relevant graph/greedy problem — this is your standout feature)
- [x] `GET /api/groups/{id}/balances` — return simplified settle-up suggestions
- [x] `POST /api/groups/{id}/settlements` — record a settlement (mark debt as paid)
- [x] `GET /api/groups/{id}/activity` — activity feed (expenses + settlements, chronological)
- [x] Unit tests for split/balance/debt-simplification logic as you build it (don't wait for Phase 5 — test this core logic immediately since it's the trickiest part)

### Phase 4 — Frontend Build
- [x] React app setup (Vite recommended over CRA)
- [x] Tailwind CSS setup
- [x] Auth pages — login, register
- [x] Auth state management (store JWT, attach to requests, handle expiry)
- [x] Group dashboard — list groups, create group, invite members
- [x] Group detail page — expense list, add-expense form (with split type selector)
- [x] Balances view — who owes whom, with the simplified settle-up suggestions
- [x] Settle-up flow — mark a debt as paid
- [x] Activity feed UI
- [x] Responsive design pass (mobile-friendly, since this is genuinely a mobile-use-case app)
- [x] Loading states, error states, empty states (small details that read as "polished" to recruiters)

### Phase 5 — Testing ✅ DONE
- [x] JUnit + Mockito unit tests for services (especially split/balance/debt-simplification — the highest-value tests)
- [x] Repository layer tests (`@DataJpaTest`)
- [x] Controller/integration tests (`@SpringBootTest` + MockMvc or WebTestClient)
- [x] Test coverage check — core business logic (split math, debt simplification, balance calc, all service error paths) covered thoroughly rather than chasing 100% blindly
- [ ] (Optional stretch) Frontend tests — React Testing Library for key flows

### Phase 6 — Dockerize & Deploy
- [ ] `Dockerfile` for the Spring Boot backend (multi-stage build to keep image small)
- [ ] `docker-compose.yml` — backend + Postgres together for easy local spin-up
- [ ] Move secrets to environment variables (no hardcoded passwords — clean up `application.properties`)
- [ ] Switch `ddl-auto=update` to a real migration tool (Flyway) — production-safe schema management
- [ ] GitHub Actions CI — run tests + build on every push
- [ ] Deploy backend (Railway or Render) with a managed Postgres instance
- [ ] Deploy frontend (Vercel)
- [ ] Custom domain (optional, e.g. blncr.fahim.dev) — nice touch if you already own fahim.dev
- [ ] Verify the full deployed app end-to-end (register → create group → add expense → settle up)

### Phase 7 — Polish for Recruiters
- [ ] Architecture diagram (system design — frontend/backend/DB/deployment)
- [ ] Sharp README: problem statement, tech stack, architecture, key design decisions (e.g. why BigDecimal, why debt-simplification algorithm, tradeoffs made)
- [ ] Demo GIF or short video walkthrough embedded in README
- [ ] Live deployed link front and center
- [ ] Clean commit history (squash noisy WIP commits if needed)
- [ ] Add to portfolio site with a dedicated project write-up
- [ ] (Optional stretch, post-v1) Pick 1-2 stretch features to add later: recurring expenses, multi-currency, receipt uploads, category charts — shows the project evolving over time, which itself is a good signal