import { CaretLeft, CaretRight } from "@phosphor-icons/react";

export default function Pagination({ page, pageCount, total, onChange }) {
  if (pageCount <= 1) {
    return <p className="text-xs text-[var(--color-text-faint)]">{total} {total === 1 ? "entry" : "entries"}</p>;
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-soft)] pt-3">
      <p className="text-xs text-[var(--color-text-faint)]">{total} entries · Page {page + 1} of {pageCount}</p>
      <div className="flex gap-1">
        <button
          type="button"
          aria-label="Previous page"
          title="Previous page"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-text-soft)] hover:bg-[var(--color-surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretLeft size={16} />
        </button>
        <button
          type="button"
          aria-label="Next page"
          title="Next page"
          disabled={page + 1 >= pageCount}
          onClick={() => onChange(page + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-text-soft)] hover:bg-[var(--color-surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretRight size={16} />
        </button>
      </div>
    </div>
  );
}