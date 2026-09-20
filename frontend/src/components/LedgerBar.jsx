import { formatSignedMoney } from "../lib/format";
import Avatar from "./Avatar";

/**
 * Renders one row of the group's balance ledger: a center zero-line with a bar
 * extending right (credit, green) when the person is owed money, or left (debit,
 * rose) when they owe. Bar length is proportional to the largest |balance| in the
 * group so the whole ledger reads at a glance, trading-tape style.
 */
export default function LedgerBar({ name, id, isYou, value, maxAbs }) {
  const n = Number(value);
  const pct = maxAbs > 0 ? Math.min(100, (Math.abs(n) / maxAbs) * 100) : 0;
  const isCredit = n > 0.005;
  const isDebit = n < -0.005;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <Avatar name={name} id={id} size="sm" />
      <span className="w-24 shrink-0 truncate text-sm text-[var(--color-text)]">
        {isYou ? "You" : name}
      </span>

      <div className="relative h-5 flex-1">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--color-border-strong)]" />
        <div className="absolute inset-y-0 left-0 right-1/2 flex justify-end overflow-hidden">
          {isDebit && (
            <div
              className="h-full rounded-l-[3px] bg-[var(--color-debit)]/70"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
        <div className="absolute inset-y-0 left-1/2 right-0 flex overflow-hidden">
          {isCredit && (
            <div
              className="h-full rounded-r-[3px] bg-[var(--color-credit)]/70"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>

      <span
        className={`ledger-figure w-20 shrink-0 text-right text-sm font-medium ${
          isCredit
            ? "text-[var(--color-credit)]"
            : isDebit
            ? "text-[var(--color-debit)]"
            : "text-[var(--color-text-faint)]"
        }`}
      >
        {formatSignedMoney(n)}
      </span>
    </div>
  );
}