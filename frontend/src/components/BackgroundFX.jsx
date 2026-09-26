import { useMemo } from "react";

// Builds one mirrored group of curved diagonal paths, following the same
// curve-generation shape as the reference "Background Paths" component,
// but at a fraction of the path count (8 vs 36) since motion here comes
// from a CSS stroke-dashoffset animation rather than re-animating each
// path's geometry every frame.
function buildPaths(position, count) {
  return Array.from({ length: count }, (_, i) => {
    const d = `M-${380 - i * 16 * position} -${189 + i * 22}C-${
      380 - i * 16 * position
    } -${189 + i * 22} -${312 - i * 16 * position} ${216 - i * 22} ${
      152 - i * 16 * position
    } ${343 - i * 22}C${616 - i * 16 * position} ${470 - i * 22} ${
      684 - i * 16 * position
    } ${875 - i * 22} ${684 - i * 16 * position} ${875 - i * 22}`;
    return { id: `${position}-${i}`, d, i };
  });
}

/**
 * Fixed full-viewport decorative background: two mirrored groups of solid
 * hairlines that continuously draw themselves out and retract — the same
 * "growing line" motion as the reference's pathLength 0.3→1 loop, done via
 * the SVG `pathLength` normalization trick (each path reports its length
 * as exactly 100 units, so stroke-dashoffset can animate 0–100 without
 * measuring real curve length in JS). One accent-tinted path per group nods
 * to the brand color without breaking the "lime reserved for focal
 * highlights" rule; the rest sit in the neutral text-faint tone.
 *
 * Pure CSS animation, no JS per-frame work, respects prefers-reduced-motion
 * via the global override in index.css.
 */
export default function BackgroundFX() {
  const groupA = useMemo(() => buildPaths(1, 8), []);
  const groupB = useMemo(() => buildPaths(-1, 8), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.55]">
      {[groupA, groupB].map((paths, gi) => (
        <svg
          key={gi}
          viewBox="0 0 696 316"
          preserveAspectRatio="xMidYMid slice"
          className={`absolute inset-0 h-full w-full ${gi === 1 ? "-scale-x-100" : ""}`}
        >
          {paths.map((p) => (
            <path
              key={p.id}
              d={p.d}
              fill="none"
              pathLength={100}
              stroke={p.i === 3 ? "var(--color-accent)" : "var(--color-text-faint)"}
              strokeWidth={0.6 + p.i * 0.05}
              strokeOpacity={p.i === 3 ? 0.4 : 0.1 + p.i * 0.025}
              className="blncr-line"
              style={{
                animationDuration: `${9 + p.i * 1.3}s`,
                animationDelay: `${-p.i * 1.8}s`,
              }}
            />
          ))}
        </svg>
      ))}
    </div>
  );
}