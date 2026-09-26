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
  Lightning,
  Terminal,
} from "@phosphor-icons/react";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import LedgerPreview from "../components/LedgerPreview";
import HeroCardArc from "../components/HeroCardArc";
import GlobeLedger from "../components/LazyGlobeLedger";
import DebtGraphCollapse from "../components/DebtGraphCollapse";
import { formatSignedMoney } from "../lib/format";
import logo from "../assets/logo.svg";

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

function PlanCard({ icon: Icon, eyebrow, title, bullets, cta, highlight, badge, href, to }) {
  const Wrapper = to ? Link : "a";
  const wrapperProps = to ? { to } : { href, target: "_blank", rel: "noreferrer" };

  return (
    <div
      className={`relative flex flex-col rounded-[var(--radius-card)] border p-6 sm:p-7 ${highlight
        ? "border-[var(--color-accent)]/40 bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-surface)] shadow-[0_0_60px_-20px_rgba(215,255,62,0.35)]"
        : "border-[var(--color-border)] bg-[var(--color-surface)]"
        }`}
    >
      {badge && (
        <span className="absolute right-6 top-6 rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent-ink)] sm:right-7 sm:top-7">
          {badge}
        </span>
      )}
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${highlight ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]" : "bg-[var(--color-surface-3)] text-[var(--color-text-soft)]"
          }`}
      >
        <Icon size={19} weight={highlight ? "fill" : "bold"} />
      </div>
      <span className="mt-4 text-xs font-medium text-[var(--color-text-faint)]">{eyebrow}</span>
      <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--color-text)]">{title}</h3>

      <ul className="mt-5 flex flex-col gap-2.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-soft)]">
            <CheckCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-credit)]" />
            <span>{b}</span>
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
            <img src={logo} alt="BLNCR" className="h-6 w-6" />
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
            Minimum cash flow algorithm inside
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Split fairly. Settle in the <span className="text-[var(--color-accent)]">fewest payments</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--color-text-soft)]">
            Not just who owes what, BLNCR runs a debt-simplification algorithm to find the fewest payments that settle the group.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg">
                Get started for free
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

      {/* Panel #1 — balances (panel left, text right) */}
      <section className="border-t border-[var(--color-border-soft)] bg-[var(--color-base-raised)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <LedgerPreview />
          <div>
            <span className="text-xs font-medium text-[var(--color-accent)]">01 · Real-time balances</span>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
              Balances that <span className="text-[var(--color-accent)]">update</span> themselves
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-soft)]">
              Every member's net position recalculates the moment an expense lands -
              no spreadsheet, no waiting on someone to "do the math."
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
              The <span className="text-[var(--color-accent)]">fewest</span> possible payments
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-soft)]">
              True minimum-transaction debt netting is NP-hard in general. BLNCR's greedy
              largest-creditor/largest-debtor heuristic doesn't chase the theoretical optimum —
              it gets real groups' tangled expenses down to a short, clean plan anyway.
            </p>
          </div>
          <div className="lg:order-2">
            <DebtGraphCollapse />
          </div>
        </div>
      </section>

      {/* Features — big visual + numbered list */}
      <section className="border-t border-[var(--color-border-soft)] bg-[var(--color-base-raised)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Everything a group needs
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-[var(--color-text-soft)]">
            Works the same whether your group's splitting a dinner bill or spread across five time zones.
          </p>
          <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <GlobeLedger />
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
                <>
                  <code className="feature-code">docker compose up --build</code> — backend + Postgres
                </>,
                <>
                  <code className="feature-code">Flyway</code>-versioned schema migrations
                </>,
                <>
                  Full <code className="feature-code">JUnit</code> + <code className="feature-code">Mockito</code> test suite
                </>,
              ]}
              cta={
                <>
                  View setup guide <ArrowUpRight size={15} />
                </>
              }
              href={`${REPO_URL}/blob/main/README.md#getting-started`}
            />
            <PlanCard
              icon={Lightning}
              eyebrow="Live"
              title="Try the live demo"
              highlight
              badge="No install"
              bullets={[
                <>
                  Deployed on <code className="feature-code">Railway</code> (API) + <code className="feature-code">Vercel</code> (frontend)
                </>,
                <>
                  Real managed Postgres, real <code className="feature-code">JWT</code> auth
                </>,
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
              <img src={logo} alt="BLNCR" className="h-5 w-5" />
              <span className="text-sm font-semibold tracking-tight text-[var(--color-text)]">BLNCR</span>
            </div>
            <nav className="flex items-center gap-5 text-sm text-[var(--color-text-soft)]">
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-[var(--color-text)] transition-colors">
                Source
              </a>
              <span>Built by Md. Fahim Hassan</span>
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