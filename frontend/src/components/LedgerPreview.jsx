import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import Avatar from "./Avatar";

// Three sample balance snapshots, cycled in a loop. Three rather than two: with two, "rotate" and "bounce" are the same sequence.
// Each snapshot sums to ~0, like a real ledger.
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
  [
    { id: 1, name: "Alice", value: 27.75 },
    { id: 2, name: "Bob", value: -9.25 },
    { id: 3, name: "Charlie", value: -18.5 },
  ],
];

const TWEEN_MS = 900;
// Ease-in-out curve as a JS function, since the tween is driven frame by frame.
function easeInOutCubic(p) {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

// Module scope on purpose: Row renders every animation frame and NumberFlow re-runs setup when prop references change.
const CURRENCY_FORMAT = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
};
const FLOW_TIMING = { duration: TWEEN_MS, easing: "cubic-bezier(0.45, 0, 0.15, 1)" };

// Computed across all snapshots so the bar scale stays fixed and only the values move.
const GLOBAL_MAX_ABS = Math.max(
  ...SNAPSHOTS.flatMap((snapshot) => snapshot.map((r) => Math.abs(r.value))),
  1
);

// Tweens toward `target` in JS so the figure and the bar stay in sync off one value.
function useAnimatedNumber(target, { active = true } = {}) {
  const [display, setDisplay] = useState(active ? 0 : target);
  const fromRef = useRef(active ? 0 : target);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    let start = performance.now();
    let lastNow = start;
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      // Hold the tween's clock still during the theme-toggle wipe so it resumes without a jump.
      const dt = now - lastNow;
      lastNow = now;
      if (document.documentElement.classList.contains("vt-transitioning")) {
        start += dt;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - start;
      const p = Math.min(1, elapsed / TWEEN_MS);
      const eased = easeInOutCubic(p);
      setDisplay(from + (to - from) * eased);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, active]);

  return display;
}

function Row({ name, id, value, maxAbs, ready }) {
  const target = Number(value);
  const displayValue = useAnimatedNumber(target, { active: ready });

  // Bar direction follows the live tweened value so it flips exactly when the magnitude crosses zero.
  const pct = ready && maxAbs > 0 ? Math.min(100, (Math.abs(displayValue) / maxAbs) * 100) : 0;
  const isCreditBar = displayValue > 0.005;
  const isDebitBar = displayValue < -0.005;

  // Color follows the target value so sign, currency and digits never disagree mid-transition.
  const isCreditText = target > 0.005;
  const isDebitText = target < -0.005;

  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} id={id} size="sm" />
      <span className="w-14 shrink-0 truncate text-xs text-[var(--color-text-soft)] sm:text-sm">
        {name}
      </span>

      <div className="relative h-5 flex-1">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[var(--color-border-strong)]" />
        <div className="absolute inset-y-0 left-0 right-1/2 flex justify-end overflow-hidden">
          {isDebitBar && (
            <div
              className="h-full rounded-l-[3px] bg-[var(--color-debit)]/90"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
        <div className="absolute inset-y-0 left-1/2 right-0 flex overflow-hidden">
          {isCreditBar && (
            <div
              className="h-full rounded-r-[3px] bg-[var(--color-credit)]/90"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>

      <span
        className={`ledger-figure w-16 shrink-0 text-right text-xs font-medium transition-colors duration-300 sm:text-sm ${
          isCreditText
            ? "text-[var(--color-credit-text)]"
            : isDebitText
            ? "text-[var(--color-debit-text)]"
            : "text-[var(--color-text-faint)]"
        }`}
      >
        <NumberFlow
          value={ready ? target : 0}
          format={CURRENCY_FORMAT}
          transformTiming={FLOW_TIMING}
          spinTiming={FLOW_TIMING}
        />
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
      // Skip this rotation while a theme wipe is in flight; try again on the next tick.
      if (document.documentElement.classList.contains("vt-transitioning")) return;
      setSnapshotIndex((i) => (i + 1) % SNAPSHOTS.length);
    }, 3600);
    return () => clearInterval(timerRef.current);
  }, []);

  const rows = SNAPSHOTS[snapshotIndex];

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
        {rows.map((r) => <Row key={r.id} {...r} maxAbs={GLOBAL_MAX_ABS} ready={ready} />)}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-4 text-xs">
        <span className="text-[var(--color-text-faint)]">Settle-up plan</span>
        <span className="ledger-figure font-medium text-[var(--color-accent-text)]">2 payments</span>
      </div>
    </div>
  );
}