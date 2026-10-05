import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, Receipt, ArrowRight, ClockCounterClockwise } from "@phosphor-icons/react";
import { formatMoney, formatDateTime } from "../lib/format";
import Avatar from "./Avatar";
import { EmptyState } from "./Feedback";
import Pagination from "./Pagination";
import { EXPENSE_CATEGORY_LABELS } from "../lib/expenseCategories";

const PAGE_SIZE = 12;

export default function ActivityFeed({ items, currentUserId, currency }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setSearch("");
    setPage(0);
  }, [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      `${item.description ?? ""} ${item.primaryUserName ?? ""} ${item.secondaryUserName ?? ""} ${EXPENSE_CATEGORY_LABELS[item.category] ?? ""}`
        .toLowerCase().includes(query));
  }, [items, search]);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visibleItems = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

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
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
        <input
          aria-label="Search activity"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(0); }}
          placeholder="Search activity"
          className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
      </label>
      {filtered.length === 0 ? (
        <EmptyState icon={MagnifyingGlass} title="No matching activity" description="Try another search." />
      ) : (
        <>
          <div className="flex flex-col divide-y divide-[var(--color-border-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
      {visibleItems.map((item) => (
        <div key={`${item.type}-${item.id}`} className="flex items-center gap-3.5 bg-[var(--color-surface)] px-4 py-3.5">
          <div
            className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] sm:flex ${
              item.type === "SETTLEMENT"
                ? "bg-[var(--color-credit-soft)] text-[var(--color-credit-text)]"
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
              <p className="break-words text-sm font-medium leading-snug text-[var(--color-text)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{item.description}</p>
            )}
            <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">
              {item.type === "SETTLEMENT" ? "Settlement" : `Paid by ${item.primaryUserId === currentUserId ? "you" : item.primaryUserName}`}
              {item.type === "EXPENSE" && item.category && ` · ${EXPENSE_CATEGORY_LABELS[item.category] ?? "Other"}`}
              {" · "}
              {formatDateTime(item.timestamp)}
            </p>
          </div>

          <span
            className={`ledger-figure shrink-0 text-sm font-medium ${
              item.type === "SETTLEMENT" ? "text-[var(--color-credit-text)]" : "text-[var(--color-text)]"
            }`}
          >
            {formatMoney(item.amount, currency)}
          </span>
        </div>
      ))}
          </div>
          <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onChange={setPage} />
        </>
      )}
    </div>
  );
}