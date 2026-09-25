import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

// Replace with real data later (e.g. the signed-in user's actual cross-group
// balances). Amounts are in whole dollars for the demo; wire to your real
// balance data however LedgerPreview/SettleUpPanel already source theirs.
const YOU = { id: "you", name: "You", location: [40.7128, -74.006] };

const MEMBERS = [
  { id: "alice", name: "Alice", location: [51.5072, -0.1276], amount: 42 }, // London
  { id: "marco", name: "Marco", location: [-33.9249, 18.4241], amount: -18 }, // Cape Town — was Milan, only ~6° of latitude from Alice, which is why the tags kept colliding on screen regardless of rotation angle
  { id: "yuki", name: "Yuki", location: [35.6762, 139.6503], amount: 65 },
  { id: "priya", name: "Priya", location: [19.076, 72.8777], amount: -27 },
];

// Theme colors as normalized [r,g,b] — keep these in sync with index.css by hand,
// cobe's WebGL layer can't read CSS variables directly.
const ACCENT = [0.843, 1, 0.243]; // --color-accent      #d7ff3e
const CREDIT = [0.204, 0.827, 0.6]; // --color-credit    #34d399
const DEBIT = [0.984, 0.443, 0.522]; // --color-debit    #fb7185

// dark:1 makes the OCEAN transparent (your page shows through) — it does NOT
// dim the dots. baseColor is the literal color of the land-mass dots, so on a
// dark page it needs to be bright, not a dim gray, or the dots read as
// invisible even though they're technically drawing. diffuse needs to be much
// higher too for real light/shadow contrast across the sphere (checked this
// against a real production dark-mode cobe globe, not guessed twice in a row).
const GLOBE_BASE = [0.92, 0.94, 0.9];
const GLOBE_GLOW = [0.22, 0.26, 0.11];

const IDLE_PHI_SPEED = 0.02; // baseline auto-rotate speed when untouched
const FRICTION = 0.94; // per-frame velocity decay after release — higher = coasts longer
const THETA_LIMIT = 1.3; // radians (~74°) — stops the drag short of flipping the globe upside down

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export default function GlobeLedger({ className = "" }) {
  const canvasRef = useRef(null);

  // Current absolute view angles, mutated directly by both dragging and the
  // momentum/idle loop — there's no "rest" state to snap back to, wherever
  // this ends up is where it stays.
  const rotationRef = useRef({ phi: 0, theta: 0.28 });
  // Angular velocity per frame. phi starts at the idle speed so it's already
  // auto-rotating before anyone touches it; theta starts at 0 (no vertical drift).
  const velocityRef = useRef({ phi: IDLE_PHI_SPEED, theta: 0 });
  const pointerRef = useRef(null); // last pointer {x, y} while dragging
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback((e) => {
    isDraggingRef.current = true;
    pointerRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { phi: 0, theta: 0 };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    pointerRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    // Whatever velocityRef holds at this instant (the smoothed drag speed
    // from the last few pointermoves) becomes the flung momentum — picked
    // up as-is by the render loop's friction decay below.
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingRef.current || !pointerRef.current) return;
      const dx = e.clientX - pointerRef.current.x;
      const dy = e.clientY - pointerRef.current.y;
      pointerRef.current = { x: e.clientX, y: e.clientY };

      const dPhi = dx / 200;
      const dTheta = dy / 200; // dragging down tilts the near side down, like spinning a ball toward you

      rotationRef.current.phi += dPhi;
      rotationRef.current.theta = clamp(rotationRef.current.theta + dTheta, -THETA_LIMIT, THETA_LIMIT);

      // Smooth (not instant) velocity estimate, so a fling reads from the
      // last stretch of motion rather than one noisy final pixel delta.
      velocityRef.current.phi = velocityRef.current.phi * 0.7 + dPhi * 0.3;
      velocityRef.current.theta = velocityRef.current.theta * 0.7 + dTheta * 0.3;
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let globe = null;
    let frameId = null;
    let cancelled = false;

    const markers = [
      { location: YOU.location, size: 0.1, color: ACCENT, id: YOU.id },
      ...MEMBERS.map((m) => ({
        location: m.location,
        size: 0.06,
        color: m.amount >= 0 ? CREDIT : DEBIT,
        id: m.id,
      })),
    ];

    const arcs = MEMBERS.map((m) => ({
      from: YOU.location,
      to: m.location,
      color: m.amount >= 0 ? CREDIT : DEBIT,
      id: m.id,
    }));

    function init() {
      if (cancelled || globe) return;
      const width = canvas.offsetWidth;
      // Below ~40px the grid/aspect-ratio layout almost certainly hasn't
      // settled yet — retry next frame instead of locking in a tiny canvas
      // resolution that CSS would then just stretch (blurry, cramped, and
      // wrongly-sized permanently, since cobe sizes its internal render
      // target once at creation, not continuously).
      if (width < 40) {
        requestAnimationFrame(init);
        return;
      }

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.28,
        dark: 1, // dark dotted globe — the CDN demo this is adapted from used a light one
        diffuse: 3,
        mapSamples: 16000,
        mapBrightness: 4,
        // Small floor so the very first frame or two (drawn before the
        // embedded map texture has finished decoding) still show *something*
        // instead of a blank sphere.
        mapBaseBrightness: 0.05,
        baseColor: GLOBE_BASE,
        markerColor: ACCENT,
        glowColor: GLOBE_GLOW,
        markers,
        arcs,
        arcColor: ACCENT,
        arcWidth: 0.4,
        arcHeight: 0.32,
        opacity: 0.85,
        markerElevation: 0.02,
      });

      requestAnimationFrame(() => {
        canvas.style.opacity = "1";
      });

      // cobe v2 removed the old onRender-callback API — createGlobe() now
      // renders exactly one frame at creation and never again on its own.
      // Driving rotation means calling globe.update() ourselves, every frame.
      function frame() {
        if (cancelled) return;

        if (!isDraggingRef.current) {
          // Momentum: keep coasting on last known velocity, decaying via
          // friction each frame. Nothing here ever pulls theta back toward
          // its starting value — wherever it comes to rest is where it stays.
          rotationRef.current.phi += velocityRef.current.phi;
          rotationRef.current.theta = clamp(
            rotationRef.current.theta + velocityRef.current.theta,
            -THETA_LIMIT,
            THETA_LIMIT
          );
          velocityRef.current.phi *= FRICTION;
          velocityRef.current.theta *= FRICTION;

          // Once the flung speed has mostly bled off, ease phi back toward
          // the gentle idle auto-spin instead of drifting to a dead stop.
          if (Math.abs(velocityRef.current.phi) < IDLE_PHI_SPEED * 1.5) {
            velocityRef.current.phi += (IDLE_PHI_SPEED - velocityRef.current.phi) * 0.01;
          }
          if (Math.abs(velocityRef.current.theta) < 0.0002) {
            velocityRef.current.theta = 0;
          }
        }
        // While dragging, handlePointerMove above already wrote the latest
        // phi/theta directly into rotationRef — nothing to do here but read it.

        globe.update({ phi: rotationRef.current.phi, theta: rotationRef.current.theta });
        frameId = requestAnimationFrame(frame);
      }
      frame();
    }

    requestAnimationFrame(init);

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (globe) globe.destroy();
    };
  }, []);

  return (
    <div
      className={`relative mx-auto aspect-square w-full max-w-[380px] select-none ${className}`}
      style={{ aspectRatio: "1 / 1", minHeight: 260 }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1s ease",
          touchAction: "none",
        }}
      />

      {/* "You" tag — anchored to the you marker via cobe's CSS anchor positioning.
          Stays hidden (opacity var defaults to 0) in browsers without anchor-positioning
          support, so the globe itself still renders fine everywhere; the tags are a
          progressive enhancement, not a requirement. */}
      <div
        className="pointer-events-none absolute flex flex-col items-center"
        style={{
          positionAnchor: `--cobe-${YOU.id}`,
          bottom: "anchor(top)",
          left: "anchor(center)",
          translate: "-50% -6px",
          opacity: `var(--cobe-visible-${YOU.id}, 0)`,
          filter: `blur(calc((1 - var(--cobe-visible-${YOU.id}, 0)) * 6px))`,
          transition: "opacity 0.3s, filter 0.3s",
        }}
      >
        <span
          className="ledger-figure rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap"
          style={{
            borderColor: "var(--color-accent)",
            color: "var(--color-accent)",
            background: "var(--color-surface)",
          }}
        >
          You
        </span>
      </div>

      {/* member name tags */}
      {MEMBERS.map((m) => (
        <div
          key={m.id}
          className="pointer-events-none absolute flex flex-col items-center"
          style={{
            positionAnchor: `--cobe-${m.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% -6px",
            opacity: `var(--cobe-visible-${m.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 6px))`,
            transition: "opacity 0.3s, filter 0.3s",
          }}
        >
          <span className="whitespace-nowrap rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text)]">
            {m.name}
          </span>
        </div>
      ))}

      {/* arc amount tags — signed, colored credit/debit like every other balance in the app */}
      {MEMBERS.map((m) => (
        <div
          key={`arc-${m.id}`}
          className="pointer-events-none absolute"
          style={{
            positionAnchor: `--cobe-arc-${m.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            opacity: `var(--cobe-visible-arc-${m.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-arc-${m.id}, 0)) * 6px))`,
            transition: "opacity 0.3s, filter 0.3s",
          }}
        >
          <span
            className="ledger-figure whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
            style={{
              color: m.amount >= 0 ? "var(--color-credit)" : "var(--color-debit)",
              background: m.amount >= 0 ? "var(--color-credit-soft)" : "var(--color-debit-soft)",
            }}
          >
            {m.amount >= 0 ? "+" : "–"}${Math.abs(m.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}