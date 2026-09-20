import { Receipt, ArrowRight, ClockCounterClockwise } from "@phosphor-icons/react";
import { formatMoney, formatDateTime } from "../lib/format";
import Avatar from "./Avatar";
import { EmptyState } from "./Feedback";

export default function ActivityFeed({ items, currentUserId }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ClockCounterClockwise}
        title="No activity yet"
        description="Expenses and settlements will show up here as they happen."
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-[var(--color-border-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
      {items.map((item) => (
        <div key={`${item.type}-${item.id}`} className="flex items-center gap-3.5 bg-[var(--color-surface)] px-4 py-3.5">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${
              item.type === "SETTLEMENT"
                ? "bg-[var(--color-credit-soft)] text-[var(--color-credit)]"
                : "bg-[var(--color-surface-3)] text-[var(--color-text-faint)]"
            }`}
          >
            <Receipt size={16} />
          </div>

          <div className="min-w-0 flex-1">
            {item.type === "SETTLEMENT" ? (
              <p className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-text)]">
                <Avatar name={item.primaryUserName} id={item.primaryUserId} size="sm" className="h-4 w-4 text-[9px]" />
                {item.primaryUserId === currentUserId ? "You" : item.primaryUserName}
                <ArrowRight size={11} className="text-[var(--color-text-faint)]" />
                {item.secondaryUserId === currentUserId ? "you" : item.secondaryUserName}
              </p>
            ) : (
              <p className="truncate text-sm font-medium text-[var(--color-text)]">{item.description}</p>
            )}
            <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">
              {item.type === "SETTLEMENT" ? "Settlement" : `Paid by ${item.primaryUserId === currentUserId ? "you" : item.primaryUserName}`}
              {" · "}
              {formatDateTime(item.timestamp)}
            </p>
          </div>

          <span
            className={`ledger-figure shrink-0 text-sm font-medium ${
              item.type === "SETTLEMENT" ? "text-[var(--color-credit)]" : "text-[var(--color-text)]"
            }`}
          >
            {formatMoney(item.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}