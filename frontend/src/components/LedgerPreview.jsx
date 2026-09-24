import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import { formatSignedMoney } from "../lib/format";

// Two sample "snapshots" of a group's balances. The widget cross-fades/animates
// between them on a loop, and animates in from zero on mount — purely decorative,
// this never talks to the API. It exists to let a visitor "see" BLNCR's signature
// idea (balances resolving toward zero) before they've logged in.
const SNAPSHOTS = [
  [
    { id: 1, name: "Alice", value: 42.5 },
    { id: 2, name: "Bob", value: -18.25 },
    { id: 3, name: "Charlie", value: -24.25 },
  ],
  [
    { id: 1, name: "Alice", value: 12.0 },
    { id: 2, name: "Bob", value: 6.5 },
    { id: 3, name: "Charlie", value: -18.5 },
  ],
];

function Row({ name, id, value, maxAbs, ready }) {
  const n = Number(value);
  const pct = ready && maxAbs > 0 ? Math.min(100, (Math.abs(n) / maxAbs) * 100) : 0;
  const isCredit = n > 0.005;
  const isDebit = n < -0.005;

  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} id={id} size="sm" />
      <span className="w-14 shrink-0 truncate text-xs text-[var(--color-text-soft)] sm:text-sm">
        {name}
      </span>

      <div className="relative h-5 flex-1">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--color-border-strong)]" />
        <div className="absolute inset-y-0 left-0 right-1/2 flex justify-end overflow-hidden">
          {isDebit && (
            <div
              className="h-full rounded-l-[3px] bg-[var(--color-debit)]/70 transition-[width] duration-700 [transition-timing-function:var(--ease-snap)]"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
        <div className="absolute inset-y-0 left-1/2 right-0 flex overflow-hidden">
          {isCredit && (
            <div
              className="h-full rounded-r-[3px] bg-[var(--color-credit)]/70 transition-[width] duration-700 [transition-timing-function:var(--ease-snap)]"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>

      <span
        className={`ledger-figure w-16 shrink-0 text-right text-xs font-medium sm:text-sm ${
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

export default function LedgerPreview({ className = "" }) {
  const [snapshotIndex, setSnapshotIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Animate in from zero shortly after mount (so the bars visibly grow, not just appear).
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSnapshotIndex((i) => (i + 1) % SNAPSHOTS.length);
    }, 3600);
    return () => clearInterval(timerRef.current);
  }, []);

  const rows = SNAPSHOTS[snapshotIndex];
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.value)), 1);

  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-faint)]">Weekend trip</span>
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-text-faint)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-credit)]" />
          live balances
        </span>
      </div>

      <div className="flex flex-col gap-3.5">
        {rows.map((r) => <Row key={r.id} {...r} maxAbs={maxAbs} ready={ready} />)}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-4 text-xs">
        <span className="text-[var(--color-text-faint)]">Settle-up plan</span>
        <span className="ledger-figure font-medium text-[var(--color-accent)]">2 payments</span>
      </div>
    </div>
  );
}