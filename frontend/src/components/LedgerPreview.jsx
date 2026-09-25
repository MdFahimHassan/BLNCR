import { useEffect, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import Avatar from "./Avatar";

// Three sample "snapshots" of a group's balances, cycled forward in a loop
// (0 -> 1 -> 2 -> 0 -> ...). Deliberately 3+ states, not 2: with only two
// snapshots, "rotate forward" and "bounce back and forth" are the same
// sequence, so every other transition retraces the previous one in reverse —
// that's what read as a "jump." A third state makes it a real rotation.
// Each snapshot's values sum to ~0 (credits balance debits), like a real ledger.
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
// Slow start, quicker middle, gentle stop — the same family of curve used
// elsewhere in the hero, just expressed as a JS function since we're driving
// this frame-by-frame with rAF rather than a CSS transition.
function easeInOutCubic(p) {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

// Hoisted to module scope on purpose: Row re-renders on every animation
// frame (that's how the bar tween works), and NumberFlow re-runs internal
// setup work whenever the *reference* of these props changes — not just
// when their contents change. Defining `{...}` inline in the JSX below would
// create a brand-new object on every one of those ~54 renders per transition,
// which is what was causing the stutter. Stable references fix it.
const CURRENCY_FORMAT = {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
};
const FLOW_TIMING = { duration: TWEEN_MS, easing: "cubic-bezier(0.45, 0, 0.15, 1)" };

// Computed once, across every snapshot, not per-snapshot: this is the bar's
// fixed 0-100% scale. If this were recalculated from just the *current*
// snapshot's values (as it was before), the scale itself would silently
// rescale the instant you switch snapshots — before the tween even starts
// moving the number — which is what showed up as a jump at every transition
// boundary. A fixed global scale means only the values move; the ruler never does.
const GLOBAL_MAX_ABS = Math.max(
  ...SNAPSHOTS.flatMap((snapshot) => snapshot.map((r) => Math.abs(r.value))),
  1
);

// Tweens a number from its previous value to `target` like a stopwatch/odometer
// counter, instead of jumping straight to the new figure. Driving this in JS
// (rather than relying on a separate CSS width transition on the bar) means
// the number and the bar are always perfectly in sync, off one shared value.
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

    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
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

  // Bar: sign must follow the live tweened value so the two direction-divs
  // swap over exactly when the animated magnitude passes through zero — that's
  // what avoids a width jump (see GLOBAL_MAX_ABS above for the other half of that fix).
  const pct = ready && maxAbs > 0 ? Math.min(100, (Math.abs(displayValue) / maxAbs) * 100) : 0;
  const isCreditBar = displayValue > 0.005;
  const isDebitBar = displayValue < -0.005;

  // Text color: NumberFlow runs its own internal transition for the sign,
  // currency symbol and digits, on its own schedule — it doesn't expose an
  // in-progress value the way our own tween does. Keying the figure's color
  // to the live tween meant the sign/currency and the digits could briefly
  // disagree on color mid-transition. Keying it to the *target* instead means
  // the whole figure is one stable color for the entire transition, changing
  // only once — at the same instant NumberFlow's own value prop changes.
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
              className="h-full rounded-l-[3px] bg-[var(--color-debit)]/70"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
        <div className="absolute inset-y-0 left-1/2 right-0 flex overflow-hidden">
          {isCreditBar && (
            <div
              className="h-full rounded-r-[3px] bg-[var(--color-credit)]/70"
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>

      <span
        className={`ledger-figure w-16 shrink-0 text-right text-xs font-medium transition-colors duration-300 sm:text-sm ${
          isCreditText
            ? "text-[var(--color-credit)]"
            : isDebitText
            ? "text-[var(--color-debit)]"
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
        <span className="ledger-figure font-medium text-[var(--color-accent)]">2 payments</span>
      </div>
    </div>
  );
}