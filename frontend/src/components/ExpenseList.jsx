import { Receipt } from "@phosphor-icons/react";
import { formatMoney, formatDate } from "../lib/format";
import Avatar from "./Avatar";
import { EmptyState } from "./Feedback";

const SPLIT_LABEL = { EQUAL: "Equal", EXACT: "Exact", PERCENTAGE: "Percent" };

export default function ExpenseList({ expenses, currentUserId }) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Add the first expense to start tracking who owes what."
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-[var(--color-border-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
      {expenses.map((exp) => {
        const yourSplit = exp.splits.find((s) => s.userId === currentUserId);
        return (
          <div key={exp.id} className="flex items-center gap-4 bg-[var(--color-surface)] px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-surface-3)] text-[var(--color-text-faint)]">
              <Receipt size={16} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-text)]">{exp.description}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-text-faint)]">
                <Avatar name={exp.paidByName} id={exp.paidByUserId} size="sm" className="h-4 w-4 text-[9px]" />
                <span>
                  {exp.paidByUserId === currentUserId ? "You" : exp.paidByName} paid ·{" "}
                  {SPLIT_LABEL[exp.splitType]} split · {formatDate(exp.createdAt)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="ledger-figure text-sm font-medium text-[var(--color-text)]">
                {formatMoney(exp.amount)}
              </p>
              {yourSplit && (
                <p className="ledger-figure text-xs text-[var(--color-text-faint)]">
                  your share {formatMoney(yourSplit.amountOwed)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}