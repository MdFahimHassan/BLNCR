import { Link } from "react-router-dom";
import { UsersThree, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { formatDate, formatSignedMoney } from "../lib/format";

export default function GroupCard({ group, balance }) {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="group flex flex-col justify-between gap-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-[background-color,border-color,transform] duration-150 [transition-timing-function:var(--ease-snap)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[1rem] font-semibold text-[var(--color-text)]">{group.name}</h3>
          <p className="mt-1 text-xs text-[var(--color-text-faint)]">
            Created {formatDate(group.createdAt)} by {group.createdByName}
          </p>
        </div>
        <ArrowRight
          size={16}
          className="mt-0.5 shrink-0 text-[var(--color-text-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent-text)]"
        />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-soft)]">
          <UsersThree size={14} />
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </div>
        <GroupBalance balance={balance} currency={group.currency} />
      </div>
    </Link>
  );
}

function GroupBalance({ balance, currency }) {
  // Still loading, or the balances call for this one group failed — either
  // way there's nothing honest to show, so stay quiet rather than guess.
  // A skeleton (not a spinner) because this card already rendered with real
  // content; only this one figure is pending.
  if (!balance) {
    return <div className="h-4 w-16 animate-pulse rounded-full bg-[var(--color-surface-3)]" />;
  }
  if (balance.error) return null;

  if (Math.abs(balance.net) < 0.005) {
    return (
      <div className="flex items-center gap-1 text-xs text-[var(--color-text-faint)]">
        <CheckCircle size={13} />
        Settled up
      </div>
    );
  }

  const isCredit = balance.net > 0;
  return (
    <div className="text-right">
      <p
        className={`ledger-figure text-sm font-semibold ${
          isCredit ? "text-[var(--color-credit-text)]" : "text-[var(--color-debit-text)]"
        }`}
      >
        {formatSignedMoney(balance.net, currency)}
      </p>
      <p className="text-[10px] text-[var(--color-text-faint)]">
        {isCredit ? "you're owed" : "you owe"}
      </p>
    </div>
  );
}