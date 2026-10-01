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
        <label className="relative min-w-48 flex-1">
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
          className="h-10 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
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
              <p className="mt-1 text-[10px] text-[var(--color-text-faint)]">
                {EXPENSE_CATEGORY_LABELS[exp.category] ?? "Other"}
              </p>
            </div>

            <div className="text-right">
              <p className="ledger-figure text-sm font-medium text-[var(--color-text)]">
                {formatMoney(exp.amount, currency)}
              </p>
              {yourSplit && (
                <p className="ledger-figure text-xs text-[var(--color-text-faint)]">
                  your share {formatMoney(yourSplit.amountOwed, currency)}
                </p>
              )}
            </div>
            {canManageExpense(exp) && (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={`Edit ${exp.description}`}
                  title="Edit expense"
                  onClick={() => onEdit(exp)}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                >
                  <PencilSimple size={15} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${exp.description}`}
                  title="Delete expense"
                  onClick={() => onDelete(exp)}
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-[var(--color-text-faint)] hover:bg-[var(--color-debit-soft)] hover:text-[var(--color-debit-text)]"
                >
                  <Trash size={15} />
                </button>
              </div>
            )}
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