# BLNCR

**Split group expenses fairly. Settle up with the fewest possible payments.**

BLNCR (Balancer) is a full-stack expense-splitting application for roommates, trips, and shared households. Unlike a basic "who owes what" tracker, BLNCR computes the *minimum number of transactions* needed to settle an entire group — turning a tangled web of debts into a short, clean payment list.

>  **Status:** Actively in development. This README will be updated as features ship. See the [Roadmap](#roadmap) for what's built and what's next.

---

## Why BLNCR?

Most expense splitters stop at "Alice owes Bob $10, Bob owes Charlie $10, Charlie owes Alice $5." BLNCR goes further: it treats group debt as a graph problem and simplifies it down to the fewest payments required to zero everyone out — the same category of problem used in real-world settlement and netting systems.

## Features

- **Group expense tracking** — create groups, add members, log shared expenses
- **Flexible splitting** — equal, exact-amount, or percentage-based splits
- **Smart balance calculation** — real-time view of who owes whom
- **Debt simplification engine** — minimizes the total number of settle-up transactions in a group
- **Settlement tracking** — mark debts as paid, keep a running activity history
- **Precise financial math** — all monetary values use `BigDecimal`, avoiding the floating-point rounding errors that plague naive implementations

## Tech Stack

**Backend**
- Java 21 · Spring Boot · Spring Security · Spring Data JPA
- PostgreSQL
- JWT-based authentication
- Maven

**Frontend**
- React · Tailwind CSS

**Infrastructure**
- Docker
- GitHub Actions (CI)
- Deployed on Railway/Render (API) + Vercel (client)

## Architecture

```
┌─────────────┐      REST/JSON       ┌──────────────────┐      JPA/Hibernate      ┌──────────────┐
│   React     │ ───────────────────▶ │   Spring Boot     │ ─────────────────────▶ │  PostgreSQL  │
│   Frontend  │ ◀─────────────────── │   REST API        │ ◀───────────────────── │   Database   │
└─────────────┘      JWT Auth        └──────────────────┘                          └──────────────┘
```

A layered backend architecture (`controller → service → repository`) keeps business logic — particularly the split and debt-simplification algorithms — decoupled from persistence and transport concerns, making the core logic independently testable.

## Getting Started

### Prerequisites
- Java 21+
- Maven
- Docker (for PostgreSQL)
- Node.js + npm (for the frontend)

### Backend Setup

```bash
# Start PostgreSQL
docker run --name blncr-db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=blncr -p 5432:5432 -d postgres

# Configure src/main/resources/application.properties with your DB credentials

# Run the app
./mvnw spring-boot:run
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Roadmap

- [x] Data model & entity design
- [x] Backend foundation (Spring Boot + PostgreSQL + JPA)
- [ ] JWT authentication (register/login)
- [ ] Expense & split logic
- [ ] **Debt simplification algorithm**
- [ ] React frontend
- [ ] Automated test suite (JUnit + Mockito)
- [ ] Dockerized deployment + CI pipeline
- [ ] Live demo

## Design Decisions

- **`BigDecimal` over `float`/`double`** for all monetary fields — floating-point types introduce rounding errors that are unacceptable in financial calculations.
- **JWT over session-based auth** — stateless auth scales more naturally for a REST API consumed by a decoupled frontend.
- **Layered architecture** — separating controllers, services, and repositories keeps the debt-simplification logic isolated and unit-testable without spinning up the full Spring context.

## License

MIT
