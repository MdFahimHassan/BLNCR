import { useEffect, useState } from "react";
import Avatar from "./Avatar";

// Triangle layout in a 400x224 viewBox — Alice at top (receiver), Bob/Charlie at the base.
const NODES = [
  { name: "Alice", left: "50%", top: "15.2%", receiver: true },
  { name: "Bob", left: "21.5%", top: "83%" },
  { name: "Charlie", left: "78.5%", top: "83%" },
];

// The messy "before" state: every pair owes something in both directions.
const RAW_EDGES = [
  { d: "M200,34 Q128.6,99.2 86,186", amount: 12, left: "33.95%", top: "46.7%" }, // Alice -> Bob
  { d: "M86,186 Q157.4,120.8 200,34", amount: 19, left: "37.55%", top: "51.5%" }, // Bob -> Alice
  { d: "M86,186 Q200,206 314,186", amount: 14, left: "50%", top: "87.5%" }, // Bob -> Charlie
  { d: "M314,186 Q200,166 86,186", amount: 6, left: "50%", top: "78.6%" }, // Charlie -> Bob
  { d: "M314,186 Q271.4,99.2 200,34", amount: 9, left: "66.05%", top: "46.7%" }, // Charlie -> Alice
];

// The simplified "after" state: the minimum payment plan.
const FINAL_EDGES = [
  { d: "M314,186 Q263.4,103.6 200,34", amount: 18, left: "65%", top: "47.7%" }, // Charlie -> Alice
  { d: "M86,186 Q135,104 200,34", amount: 7, left: "34.75%", top: "47.7%" }, // Bob -> Alice
];

function Crossfade({ show, children }) {
  return (
    <span
      className={`absolute inset-0 flex items-center transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </span>
  );
}

export default function DebtGraphCollapse() {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const delay = settled ? 3400 : 2800;
    const t = setTimeout(() => setSettled((s) => !s), delay);
    return () => clearTimeout(t);
  }, [settled]);

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      {/* Header */}
      <div className="mb-1.5 flex h-[18px] items-center justify-between text-xs">
        <span className="relative w-24">
          <Crossfade show={!settled}>
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[var(--color-text-faint)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-debit)]" />
              who owes who
            </span>
          </Crossfade>
          <Crossfade show={settled}>
            <span className="ledger-figure rounded-full bg-[var(--color-credit-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-credit)]">
              optimal
            </span>
          </Crossfade>
        </span>
        <span className="ledger-figure relative w-20 whitespace-nowrap text-right">
          <Crossfade show={!settled}>
            <span className="w-full text-right text-[var(--color-text-faint)]">5 debts</span>
          </Crossfade>
          <Crossfade show={settled}>
            <span className="w-full text-right text-[var(--color-text-faint)]">2 payments</span>
          </Crossfade>
        </span>
      </div>

      {/* Caption */}
      <div className="relative mb-2.5 h-[18px] text-center text-[13px] font-medium">
        <Crossfade show={!settled}>
          <span className="w-full text-[var(--color-debit)]">everyone owes a bit of everyone</span>
        </Crossfade>
        <Crossfade show={settled}>
          <span className="w-full text-[var(--color-accent)]">→ collapsed to the minimum</span>
        </Crossfade>
      </div>

      {/* Graph */}
      <div className="relative aspect-[400/224] w-full">
        <svg viewBox="0 0 400 224" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <marker id="dgc-arrow-raw" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="#fb7185" />
            </marker>
            <filter id="dgc-glow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Raw (messy) debts — fades out immediately when settling, fades in only once the final lines have mostly cleared on the way back */}
          {RAW_EDGES.map((e, i) => (
            <g
              key={`raw-${i}`}
              className="transition-opacity duration-500 ease-out"
              style={{ opacity: settled ? 0 : 0.7, transitionDelay: settled ? "0ms" : "320ms" }}
            >
              <path
                d={e.d}
                fill="none"
                stroke="#fb7185"
                strokeWidth="1.75"
                strokeDasharray="1 5"
                strokeLinecap="round"
                markerEnd="url(#dgc-arrow-raw)"
              />
              <circle r="3.2" fill="#fb7185" opacity="0.5" filter="url(#dgc-glow)">
                <animateMotion dur="2.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" path={e.d} />
              </circle>
              <circle r="1.5" fill="#ffd3da">
                <animateMotion dur="2.6s" begin={`${i * 0.4}s`} repeatCount="indefinite" path={e.d} />
              </circle>
            </g>
          ))}

          {/* Simplified (final) payments — fades out immediately when un-settling, fades in only once the raw lines have mostly cleared */}
          {FINAL_EDGES.map((e, i) => (
            <g
              key={`final-${i}`}
              className="transition-opacity duration-500 ease-out"
              style={{ opacity: settled ? 1 : 0, transitionDelay: settled ? "320ms" : "0ms" }}
            >
              <path
                d={e.d}
                fill="none"
                stroke="#d7ff3e"
                strokeWidth="2.75"
                strokeLinecap="round"
              />
              <circle r="3.6" fill="#d7ff3e" opacity="0.55" filter="url(#dgc-glow)">
                <animateMotion dur="2.2s" begin={`${i * 0.5}s`} repeatCount="indefinite" path={e.d} />
              </circle>
              <circle r="1.7" fill="#f4ffb8">
                <animateMotion dur="2.2s" begin={`${i * 0.5}s`} repeatCount="indefinite" path={e.d} />
              </circle>
            </g>
          ))}
        </svg>

        {NODES.map((n) => (
          <div
            key={n.name}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-shadow duration-500 ${
              n.receiver && settled ? "shadow-[0_0_0_4px_rgba(215,255,62,0.16)]" : ""
            }`}
            style={{ left: n.left, top: n.top }}
          >
            <Avatar name={n.name} size="md" />
          </div>
        ))}

        {RAW_EDGES.map((e, i) => (
          <div
            key={`raw-amt-${i}`}
            className="ledger-figure absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[var(--color-border-soft)] bg-[var(--color-base-raised)] px-1.5 py-px text-[10.5px] font-medium text-[var(--color-debit)] transition-opacity duration-450"
            style={{ left: e.left, top: e.top, opacity: settled ? 0 : 0.85 }}
          >
            ${e.amount}
          </div>
        ))}

        {FINAL_EDGES.map((e, i) => (
          <div
            key={`final-amt-${i}`}
            className="ledger-figure absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[var(--color-border)] bg-[var(--color-base-raised)] px-1.5 py-0.5 text-xs font-semibold text-[var(--color-accent)] transition-opacity delay-300 duration-500"
            style={{ left: e.left, top: e.top, opacity: settled ? 1 : 0 }}
          >
            ${e.amount}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-3 text-xs text-[var(--color-text-faint)]">
        <span>5 raw debts, simplified</span>
        <span className="ledger-figure relative inline-block h-4 w-20 font-medium text-[var(--color-accent)]">
          <Crossfade show={!settled}>
            <span className="w-full text-right">5 payments</span>
          </Crossfade>
          <Crossfade show={settled}>
            <span className="w-full text-right">2 payments</span>
          </Crossfade>
        </span>
      </div>
    </div>
  );
}