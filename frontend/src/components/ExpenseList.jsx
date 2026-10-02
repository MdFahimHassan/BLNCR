import { useEffect, useMemo, useState } from "react";
import { DownloadSimple, MagnifyingGlass, PencilSimple, Receipt, Trash } from "@phosphor-icons/react";
import { formatMoney, formatDate } from "../lib/format";
import Avatar from "./Avatar";
import { EmptyState } from "./Feedback";
import Button from "./Button";
import Pagination from "./Pagination";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "../lib/expenseCategories";

const SPLIT_LABEL = { EQUAL: "Equal", EXACT: "Exact", PERCENTAGE: "Percent" };
const PAGE_SIZE = 10;

export default function ExpenseList({
  expenses,
  currentUserId,
  currency,
  groupId,
  canManageExpense,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(0);

  useEffect(() => {
    setSearch("");
    setCategory("ALL");
    setPage(0);
  }, [groupId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchesCategory = category === "ALL" || expense.category === category;
      const text = `${expense.description} ${expense.paidByName} ${EXPENSE_CATEGORY_LABELS[expense.category] ?? ""}`.toLowerCase();
      return matchesCategory && (!query || text.includes(query));
    });
  }, [expenses, search, category]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visibleExpenses = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const exportCsv = () => {
    const rows = [
      ["Date", "Description", "Category", "Amount", "Currency", "Paid by", "Split type"],
      ...filtered.map((expense) => [
        expense.createdAt,
        expense.description,
        EXPENSE_CATEGORY_LABELS[expense.category] ?? "Other",
        expense.amount,
        currency,
        expense.paidByName,
        SPLIT_LABEL[expense.splitType] ?? expense.splitType,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `group-${groupId}-expenses.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-full flex-1 sm:min-w-48">
          <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
          <input
            aria-label="Search expenses"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(0); }}
            placeholder="Search expenses"
            className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <select
          aria-label="Filter expenses by category"
          value={category}
          onChange={(event) => { setCategory(event.target.value); setPage(0); }}
          className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] sm:flex-none"
        >
          <option value="ALL">All categories</option>
          {EXPENSE_CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Button variant="secondary" size="sm" icon={DownloadSimple} onClick={exportCsv} disabled={!filtered.length}>
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MagnifyingGlass} title="No matching expenses" description="Try another search or category." />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col divide-y divide-[var(--color-border-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]">
      {visibleExpenses.map((exp) => {
        const yourSplit = exp.splits.find((s) => s.userId === currentUserId);
        const payer = exp.paidByUserId === currentUserId ? "You" : exp.paidByName;
        return (
          <div key={exp.id} className="flex items-start gap-3 bg-[var(--color-surface)] px-4 py-3.5">
            {/* The icon tile is decoration; it is dropped on phones to give the text the width. */}
            <div className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-surface-3)] text-[var(--color-text-faint)] sm:flex">
              <Receipt size={16} />
            </div>

            <div className="min-w-0 flex-1">
              {/* Line 1: what it was, and how much */}
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-medium leading-snug text-[var(--color-text)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                  {exp.description}
                </p>
                <div className="shrink-0 text-right">
                  <p className="ledger-figure text-sm font-semibold text-[var(--color-text)]">
                    {formatMoney(exp.amount, currency)}
                  </p>
                  {yourSplit && (
                    <p className="ledger-figure mt-0.5 text-[11px] text-[var(--color-text-faint)]">
                      your share {formatMoney(yourSplit.amountOwed, currency)}
                    </p>
                  )}
                </div>
              </div>

              {/* Who paid / tags / actions. Phone: paid-by on its own line, tags + actions below.
                  sm and up: all three share a single line. */}
              <div className="mt-1.5 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_1fr_auto]">
                <div className="col-span-2 flex min-w-0 items-center gap-1.5 text-xs text-[var(--color-text-faint)] sm:col-span-1">
                  <Avatar name={exp.paidByName} id={exp.paidByUserId} size="sm" className="h-4 w-4 shrink-0 text-[9px]" />
                  <span className="min-w-0 truncate">
                    {payer} paid · {formatDate(exp.createdAt)}
                  </span>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-text-soft)]">
                    {EXPENSE_CATEGORY_LABELS[exp.category] ?? "Other"}
                  </span>
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-faint)]">
                    {SPLIT_LABEL[exp.splitType]} split
                  </span>
                </div>

                {canManageExpense(exp) && (
                  <div className="-mr-2 flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      aria-label={`Edit ${exp.description}`}
                      title="Edit expense"
                      onClick={() => onEdit(exp)}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                    >
                      <PencilSimple size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${exp.description}`}
                      title="Delete expense"
                      onClick={() => onDelete(exp)}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-faint)] hover:bg-[var(--color-debit-soft)] hover:text-[var(--color-debit-text)]"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
          </div>
          <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onChange={setPage} />
        </div>
      )}
    </div>
  );
}