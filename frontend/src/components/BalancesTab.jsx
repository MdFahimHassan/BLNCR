import { CheckCircle, HandCoins } from "@phosphor-icons/react";
import LedgerBar from "./LedgerBar";
import Button from "./Button";
import Avatar from "./Avatar";
import { EmptyState } from "./Feedback";
import { formatMoney } from "../lib/format";

export default function BalancesTab({ data, currentUserId, onOpenSettle }) {
  const { balances, suggestedSettlements } = data;
  const maxAbs = Math.max(1, ...balances.map((b) => Math.abs(Number(b.netBalance))));
  const allSettled = balances.every((b) => Math.abs(Number(b.netBalance)) < 0.005);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="mb-1 text-sm font-semibold text-[var(--color-text)]">Net balances</h3>
        <p className="mb-2 text-xs text-[var(--color-text-faint)]">
          Green = owed to them · Rose = they owe the group
        </p>
        <div className="divide-y divide-[var(--color-border-soft)]">
          {balances.map((b) => (
            <LedgerBar
              key={b.userId}
              name={b.name}
              id={b.userId}
              isYou={b.userId === currentUserId}
              value={b.netBalance}
              maxAbs={maxAbs}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
          Suggested settlements
        </h3>
        {allSettled ? (
          <EmptyState
            icon={CheckCircle}
            title="Everyone's settled up"
            description="No outstanding balances in this group right now."
          />
        ) : suggestedSettlements.length === 0 ? null : (
          <div className="flex flex-col gap-2">
            {suggestedSettlements.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <Avatar name={s.fromName} id={s.fromUserId} size="sm" />
                <span className="text-sm">
                  {s.fromUserId === currentUserId ? "You" : s.fromName}
                </span>
                <span className="text-xs text-[var(--color-text-faint)]">owes</span>
                <Avatar name={s.toName} id={s.toUserId} size="sm" />
                <span className="text-sm">
                  {s.toUserId === currentUserId ? "you" : s.toName}
                </span>
                <span className="ledger-figure ml-auto text-sm font-medium text-[var(--color-text)]">
                  {formatMoney(s.amount)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={HandCoins}
                  onClick={() =>
                    onOpenSettle({
                      fromUserId: s.fromUserId,
                      toUserId: s.toUserId,
                      amount: Number(s.amount).toFixed(2),
                    })
                  }
                >
                  Settle
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}