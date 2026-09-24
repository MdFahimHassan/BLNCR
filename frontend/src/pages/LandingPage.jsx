import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  GithubLogo,
  Scales,
  Percent,
  ShieldCheck,
  ClockCounterClockwise,
  CheckCircle,
  Rocket,
  Terminal,
} from "@phosphor-icons/react";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import LedgerPreview from "../components/LedgerPreview";
import HeroCardArc from "../components/HeroCardArc";
import heroCard from "../assets/hero-card.webp";
import { formatSignedMoney } from "../lib/format";

const REPO_URL = "https://github.com/MdFahimHassan/BLNCR";

const TECH = ["Java 21", "Spring Boot", "PostgreSQL", "React", "Tailwind CSS", "Docker", "GitHub Actions"];

const NUMBERED_FEATURES = [
  {
    n: "01",
    icon: Percent,
    title: "Flexible splitting",
    description: "Equal, exact-amount, or percentage splits — rounding handled in integer cents, never floats.",
  },
  {
    n: "02",
    icon: Scales,
    title: "Debt simplification",
    description: "A greedy largest-creditor/largest-debtor algorithm turns a web of IOUs into a short payment list.",
  },
  {
    n: "03",
    icon: ShieldCheck,
    title: "Precise financial math",
    description: "Every amount is a BigDecimal — no float/double rounding bugs in the money path, ever.",
  },
  {
    n: "04",
    icon: ClockCounterClockwise,
    title: "Full activity history",
    description: "Expenses and settlements merge into one chronological feed, so nothing gets lost.",
  },
];

const SETTLE_ROWS = [
  { from: "Charlie", to: "Alice", value: -18.0 },
  { from: "Bob", to: "Alice", value: -7.0 },
];

function SettleUpPanel() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-faint)]">Settle-up plan</span>
        <span className="ledger-figure rounded-full bg-[var(--color-credit-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-credit)]">
          optimal
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {SETTLE_ROWS.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--color-border-soft)] bg-[var(--color-surface-2)] px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Avatar name={r.from} size="sm" />
              <ArrowRight size={12} className="text-[var(--color-text-faint)]" />
              <Avatar name={r.to} size="sm" />
              <span className="text-xs text-[var(--color-text-soft)] sm:text-sm">
                {r.from} → {r.to}
              </span>
            </div>
            <span className="ledger-figure text-xs font-medium text-[var(--color-text)] sm:text-sm">
              {formatSignedMoney(r.value).replace("-", "")}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-3 text-xs text-[var(--color-text-faint)]">
        <span>5 raw debts, simplified</span>
        <span className="ledger-figure font-medium text-[var(--color-accent)]">2 payments</span>
      </div>
    </div>
  );
}

function StackedCards() {
  return (
    <div className="relative h-[230px] w-full sm:h-[270px]">
      <img
        src={heroCard}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-1/2 w-[200px] -translate-x-[calc(50%+64px)] -translate-y-[calc(50%+30px)] rotate-[-11deg] opacity-45 select-none sm:w-[230px]"
      />
      <img
        src={heroCard}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-1/2 w-[200px] -translate-x-[calc(50%+28px)] -translate-y-[calc(50%+12px)] rotate-[6deg] opacity-70 select-none sm:w-[230px]"
      />
      <img
        src={heroCard}
        alt="BLNCR balance card"
        draggable={false}
        className="absolute left-1/2 top-1/2 w-[200px] -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] select-none drop-shadow-[0_25px_45px_rgba(0,0,0,0.5)] sm:w-[230px]"
      />
    </div>
  );
}

function PlanCard({ icon: Icon, eyebrow, title, bullets, cta, highlight, href, to }) {
  const Wrapper = to ? Link : "a";
  const wrapperProps = to ? { to } : { href, target: "_blank", rel: "noreferrer" };

  return (
    <div
      className={`flex flex-col rounded-[var(--radius-card)] border p-6 sm:p-7 ${
        highlight
          ? "border-[var(--color-accent)]/40 bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-surface)] shadow-[0_0_60px_-20px_rgba(215,255,62,0.35)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          highlight ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]" : "bg-[var(--color-surface-3)] text-[var(--color-text-soft)]"
        }`}
      >
        <Icon size={17} weight="bold" />
      </div>
      <span className="mt-4 text-xs font-medium text-[var(--color-text-faint)]">{eyebrow}</span>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--color-text)]">{title}</h3>

      <ul className="mt-5 flex flex-col gap-2.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-[var(--color-text-soft)]">
            <CheckCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-credit)]" />
            {b}
          </li>
        ))}
      </ul>

      <Wrapper {...wrapperProps} className="mt-7">
        <Button variant={highlight ? "primary" : "secondary"} className="w-full">
          {cta}
        </Button>
      </Wrapper>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-base)]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border-soft)] bg-[var(--color-base)]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[var(--color-accent)] text-[11px] font-bold text-[var(--color-accent-ink)]">
              B
            </span>
            <span className="text-sm font-semibold tracking-tight">BLNCR</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-sm text-[var(--color-text-soft)] hover:text-[var(--color-text)] transition-colors sm:inline-flex"
            >
              <GithubLogo size={16} />
              Source
            </a>
            <Link
              to="/login"
              className="text-sm text-[var(--color-text-soft)] hover:text-[var(--color-text)] transition-colors"
            >
              Log in
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — centered, Ventrix-inspired card arc */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 mx-auto max-w-3xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-faint)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            Debt simplification, solved
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Split fairly. Settle in the <span className="text-[var(--color-accent)]">fewest payments</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--color-text-soft)]">
            Most splitters stop at "who owes what." BLNCR treats a group's debts as a graph and
            simplifies them down to the minimum number of payments needed to zero everyone out.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg">
                Get started free
                <ArrowRight size={16} weight="bold" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                Log in
              </Button>
            </Link>
          </div>
        </div>

        <HeroCardArc />
        <div className="h-6 sm:h-10" />
      </section>

      {/* Trust / tech strip */}
      <section className="border-t border-[var(--color-border-soft)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:px-6">
          <span className="text-xs font-medium text-[var(--color-text-faint)]">Built with</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {TECH.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-soft)]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Panel #1 — balances (panel left, text right) */}
      <section className="border-t border-[var(--color-border-soft)] bg-[var(--color-base-raised)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <LedgerPreview />
          <div>
            <span className="text-xs font-medium text-[var(--color-accent)]">01 · Real-time balances</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
              See exactly who owes what
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-soft)]">
              Every member's net position recalculates the moment an expense lands — no manual
              tallying, no spreadsheet, no waiting for someone to "do the math."
            </p>
          </div>
        </div>
      </section>

      {/* Panel #2 — settle-up (text left, panel right) */}
      <section className="border-t border-[var(--color-border-soft)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-1">
            <span className="text-xs font-medium text-[var(--color-accent)]">02 · Settle-up plan</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
              The fewest possible payments
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-soft)]">
              True minimum-transaction debt netting is NP-hard in general. BLNCR's greedy
              largest-creditor/largest-debtor heuristic collapses a real group's tangled expenses
              into a short, clean plan in practice.
            </p>
          </div>
          <div className="lg:order-2">
            <SettleUpPanel />
          </div>
        </div>
      </section>

      {/* Features — big visual + numbered list */}
      <section className="border-t border-[var(--color-border-soft)] bg-[var(--color-base-raised)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Everything a group needs
          </h2>
          <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <StackedCards />
            <div className="flex flex-col gap-5">
              {NUMBERED_FEATURES.map((f) => (
                <div
                  key={f.n}
                  className="flex items-start gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <span className="ledger-figure mt-0.5 text-xs font-medium text-[var(--color-text-faint)]">
                    {f.n}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <f.icon size={16} className="text-[var(--color-accent)]" />
                      <h3 className="text-sm font-semibold text-[var(--color-text)]">{f.title}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-soft)]">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two ways to run it */}
      <section className="border-t border-[var(--color-border-soft)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Two ways to see it running
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-[var(--color-text-soft)]">
            Poke at the deployed app, or run the full stack yourself in one command.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <PlanCard
              icon={Terminal}
              eyebrow="Local"
              title="Run it locally"
              bullets={[
                "docker compose up --build — backend + Postgres",
                "Flyway-versioned schema migrations",
                "Full JUnit + Mockito test suite",
              ]}
              cta={
                <>
                  View setup guide <ArrowUpRight size={15} />
                </>
              }
              href={REPO_URL}
            />
            <PlanCard
              icon={Rocket}
              eyebrow="Live"
              title="Try the live demo"
              highlight
              bullets={[
                "Deployed on Railway (API) + Vercel (frontend)",
                "Real managed Postgres, real JWT auth",
                "No setup — register and add an expense",
              ]}
              cta={
                <>
                  Get started free <ArrowRight size={15} weight="bold" />
                </>
              }
              to="/register"
            />
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="border-t border-[var(--color-border-soft)] bg-[var(--color-base-raised)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-14 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Ready to settle up?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-soft)]">
              Create a group, add your first expense, and see the plan in seconds.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <Button size="lg" variant="secondary">
                View source
              </Button>
            </a>
            <Link to="/register">
              <Button size="lg">
                Get started free
                <ArrowRight size={16} weight="bold" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-soft)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-accent-ink)]">
                B
              </span>
              <span className="text-sm font-semibold tracking-tight text-[var(--color-text)]">BLNCR</span>
            </div>
            <nav className="flex items-center gap-5 text-sm text-[var(--color-text-soft)]">
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-[var(--color-text)] transition-colors">
                Source
              </a>
              <a
                href="https://personal-portfolio-rho-lac-91.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                Built by Md. Fahim Hassan
              </a>
            </nav>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-soft)] hover:text-[var(--color-text)] transition-colors"
            >
              <GithubLogo size={16} />
            </a>
          </div>
          <div className="mt-6 border-t border-[var(--color-border-soft)] pt-6 text-center text-xs text-[var(--color-text-faint)] sm:text-left">
            © {new Date().getFullYear()} BLNCR · MIT License
          </div>
        </div>
      </footer>
    </div>
  );
}