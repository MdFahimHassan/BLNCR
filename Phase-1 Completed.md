# BLNCR — Project Context & Progress Log

## The Bigger Picture
Building toward a full-stack developer portfolio ahead of UG graduation (~2029), with possible masters after. Goal: 2-3 deep, impactful projects rather than many shallow ones. This is project #1 of that plan.

**GitHub:** https://github.com/MdFahimHassan
**Portfolio:** https://personal-portfolio-rho-lac-91.vercel.app/

## Project: BLNCR (Expense Splitter)
A group expense-splitting app (Splitwise-style) — chosen because it has real algorithmic depth (splits, balance calculation, debt simplification) beyond basic CRUD, making it more portfolio-worthy than a typical clone.

### Roadmap (7 phases)
1. **Scope & data model** ✅ Done
2. **Backend foundation** 🔄 In progress (this is where we are)
3. **Expense & split logic** — equal/exact/percentage splits, balance calc, debt-simplification algorithm
4. **Frontend build** — React + Tailwind
5. **Testing** — JUnit + Mockito
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
├── config/
├── controller/     (empty so far)
├── dto/            (empty so far)
├── entity/         ✅ 7 files done
├── exception/      (empty so far)
├── repository/     (not started)
├── security/       (not started)
└── service/        (empty so far)
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

### Current State (as of last session)
✅ App boots cleanly, connects to Postgres, all 6 tables auto-created via Hibernate (`users`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`).
✅ Confirmed working at `http://localhost:9090` — currently shows Spring Security's default login page (expected, since no custom security config or endpoints exist yet).

### Next Steps (immediate)
1. Build `UserRepository` (Spring Data JPA interface)
2. Build `POST /api/auth/register` endpoint
3. Build `POST /api/auth/login` endpoint returning a JWT
4. Configure Spring Security to open up `/api/auth/**` while protecting everything else
5. Once auth works, move to Phase 3: expense & split logic (the algorithmic core of the app)

---

## FULL ROADMAP — ALL 7 PHASES IN DETAIL

### Phase 1 — Scope & Data Model ✅ DONE
- Defined v1 features (see above)
- Designed entity relationships
- Chose BLNCR as project name

### Phase 2 — Backend Foundation 🔄 IN PROGRESS
- [x] Spring Boot project setup (Maven, Java 21)
- [x] PostgreSQL running locally via Docker
- [x] All 6 JPA entities created and verified (tables auto-created)
- [x] Confirmed app boots cleanly on port 9090
- [ ] `UserRepository`, `GroupRepository`, etc. (Spring Data JPA interfaces)
- [ ] DTOs for register/login requests & responses
- [ ] Password hashing (BCrypt via Spring Security)
- [ ] `POST /api/auth/register` endpoint
- [ ] `POST /api/auth/login` endpoint — returns JWT
- [ ] JWT utility class (generate + validate tokens)
- [ ] JWT filter (intercepts requests, validates token)
- [ ] Spring Security config — open `/api/auth/**`, protect everything else
- [ ] Global exception handler (`@ControllerAdvice`) for clean error responses
- [ ] Basic `GET /api/users/me` endpoint to test auth end-to-end
- [ ] Group endpoints: create group, add member, list my groups

### Phase 3 — Expense & Split Logic (the algorithmic core)
This is the phase that makes BLNCR more than a CRUD app — most portfolio value lives here.
- [ ] `POST /api/groups/{id}/expenses` — add an expense
- [ ] Split calculation logic:
  - EQUAL — divide amount evenly among selected members (handle rounding remainders correctly, e.g. splitting 100 among 3 people)
  - EXACT — each member specifies their own owed amount, validate it sums to total
  - PERCENTAGE — each member specifies a %, validate it sums to 100%
- [ ] Balance calculation service — for a group, compute net balance per user (who owes / is owed, in total)
- [ ] **Debt simplification algorithm** — given a set of pairwise debts, minimize the number of transactions needed to settle everyone up (classic interview-relevant graph/greedy problem — this is your standout feature)
- [ ] `GET /api/groups/{id}/balances` — return simplified settle-up suggestions
- [ ] `POST /api/groups/{id}/settlements` — record a settlement (mark debt as paid)
- [ ] `GET /api/groups/{id}/activity` — activity feed (expenses + settlements, chronological)
- [ ] Unit tests for split/balance/debt-simplification logic as you build it (don't wait for Phase 5 — test this core logic immediately since it's the trickiest part)

### Phase 4 — Frontend Build
- [ ] React app setup (Vite recommended over CRA)
- [ ] Tailwind CSS setup
- [ ] Auth pages — login, register
- [ ] Auth state management (store JWT, attach to requests, handle expiry)
- [ ] Group dashboard — list groups, create group, invite members
- [ ] Group detail page — expense list, add-expense form (with split type selector)
- [ ] Balances view — who owes whom, with the simplified settle-up suggestions
- [ ] Settle-up flow — mark a debt as paid
- [ ] Activity feed UI
- [ ] Responsive design pass (mobile-friendly, since this is genuinely a mobile-use-case app)
- [ ] Loading states, error states, empty states (small details that read as "polished" to recruiters)

### Phase 5 — Testing
- [ ] JUnit + Mockito unit tests for services (especially split/balance/debt-simplification — the highest-value tests)
- [ ] Repository layer tests (`@DataJpaTest`)
- [ ] Controller/integration tests (`@SpringBootTest` + MockMvc or WebTestClient)
- [ ] Test coverage check — aim to cover the core business logic thoroughly, not chase 100% blindly
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

---
*Use this file as context when resuming work in a new conversation — it captures all key decisions, current file/folder state, environment fixes, and the full phase-by-phase roadmap so far.*
