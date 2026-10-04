import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";
import { useTheme } from "../context/ThemeContext";

// Demo data: replace with real cross-group balances. Amounts are whole dollars.
const YOU = { id: "you", name: "You", location: [40.7128, -74.006] };

const MEMBERS = [
  { id: "alice", name: "Alice", location: [51.5072, -0.1276], amount: 42 }, // London
  { id: "marco", name: "Marco", location: [-33.9249, 18.4241], amount: -18 }, // Cape Town
  { id: "yuki", name: "Yuki", location: [35.6762, 139.6503], amount: 65 },
  { id: "priya", name: "Priya", location: [19.076, 72.8777], amount: -27 },
];

// Theme colors as [r,g,b] in 0-1; keep in sync with index.css by hand (cobe's WebGL layer can't read CSS variables).
const ACCENT = [0.843, 1, 0.243]; // --color-accent      #d7ff3e
const CREDIT = [0.204, 0.827, 0.6]; // --color-credit    #34d399
const DEBIT = [0.984, 0.443, 0.522]; // --color-debit    #fb7185

// dark:1 only makes the ocean transparent; baseColor is the literal color of the land dots, so it must contrast with the page.
// Light mode uses a dark base, which needs its own higher brightness/diffuse to keep the lit-vs-shadow falloff.
const GLOBE_COLORS = {
  dark: { base: [0.92, 0.94, 0.9], glow: [0.22, 0.26, 0.11], brightness: 4, diffuse: 3 },
  light: { base: [0.16, 0.17, 0.19], glow: [0.82, 0.83, 0.8], brightness: 7, diffuse: 4.5 },
};

const IDLE_PHI_SPEED = 0.02; // baseline auto-rotate speed when untouched
const FRICTION = 0.94; // per-frame velocity decay after release — higher = coasts longer
const THETA_LIMIT = 1.3; // radians (~74°) — stops the drag short of flipping the globe upside down

// The idle auto-spin is ambient motion, so prefers-reduced-motion turns it off; dragging stays available.
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const REST_IDLE_PHI_SPEED = prefersReducedMotion ? 0 : IDLE_PHI_SPEED;

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export default function GlobeLedger({ className = "" }) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  // Absolute view angles, mutated by both dragging and the momentum/idle loop.
  const rotationRef = useRef({ phi: 0, theta: 0.28 });
  // Angular velocity per frame; phi starts at the idle speed (or at rest under reduced motion).
  const velocityRef = useRef({ phi: REST_IDLE_PHI_SPEED, theta: 0 });
  const pointerRef = useRef(null); // last pointer {x, y} while dragging
  const isDraggingRef = useRef(false);
  // Read every frame by the render loop, so a theme flip updates the globe via globe.update() instead of recreating it.
  const themeConfigRef = useRef(GLOBE_COLORS[theme]);
  useEffect(() => {
    themeConfigRef.current = GLOBE_COLORS[theme];
  }, [theme]);

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

      // Smoothed so a fling reflects recent motion, not one noisy final delta.
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
    let isVisible = true;

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

    // Defined outside init() so the IntersectionObserver can resume the loop.
    function frame() {
      if (cancelled || !globe) return;

      // Skip the draw (not the rAF) during the theme-toggle transition so the globe doesn't compete with it for frame time.
      if (document.documentElement.classList.contains("vt-transitioning")) {
        frameId = isVisible ? requestAnimationFrame(frame) : null;
        return;
      }

      if (!isDraggingRef.current) {
        // Momentum: coast on the last velocity, decaying by FRICTION each frame.
        rotationRef.current.phi += velocityRef.current.phi;
        rotationRef.current.theta = clamp(
          rotationRef.current.theta + velocityRef.current.theta,
          -THETA_LIMIT,
          THETA_LIMIT
        );
        velocityRef.current.phi *= FRICTION;
        velocityRef.current.theta *= FRICTION;

        // Once the fling bleeds off, ease phi back to the idle spin (or to a stop under reduced motion).
        if (Math.abs(velocityRef.current.phi) < IDLE_PHI_SPEED * 1.5) {
          velocityRef.current.phi += (REST_IDLE_PHI_SPEED - velocityRef.current.phi) * 0.01;
        }
        if (Math.abs(velocityRef.current.theta) < 0.0002) {
          velocityRef.current.theta = 0;
        }
      }

      globe.update({
        phi: rotationRef.current.phi,
        theta: rotationRef.current.theta,
        baseColor: themeConfigRef.current.base,
        glowColor: themeConfigRef.current.glow,
        diffuse: themeConfigRef.current.diffuse,
        mapBrightness: themeConfigRef.current.brightness,
      });

      // Off-screen: stop scheduling frames; the observer below restarts the loop.
      frameId = isVisible ? requestAnimationFrame(frame) : null;
    }

    function init() {
      if (cancelled || globe) return;
      const width = canvas.offsetWidth;
      // Under ~40px the layout hasn't settled; retry next frame instead of locking in a tiny render size.
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
        dark: 1,
        diffuse: themeConfigRef.current.diffuse,
        mapSamples: 16000,
        mapBrightness: themeConfigRef.current.brightness,
        // Small floor so the first frames, drawn before the map texture decodes, aren't blank.
        mapBaseBrightness: 0.05,
        baseColor: themeConfigRef.current.base,
        markerColor: ACCENT,
        glowColor: themeConfigRef.current.glow,
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

      // cobe v2 renders once at creation; rotation needs globe.update() every frame.
      frame();
    }

    requestAnimationFrame(init);

    let observer = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
          if (isVisible && frameId === null && globe) frame();
        },
        { rootMargin: "100px" }
      );
      observer.observe(canvas);
    }

    // cobe sizes its render target once, so re-measure on resize/rotation and push the new size via globe.update().
    let resizeTimer = null;
    let lastWidth = null;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (cancelled || !globe) return;
        const newWidth = canvas.offsetWidth;
        if (newWidth < 40 || newWidth === lastWidth) return;
        lastWidth = newWidth;
        globe.update({
          width: newWidth,
          height: newWidth,
          devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        });
      }, 150); // debounced — resize/orientationchange can fire repeatedly mid-gesture
    }
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (observer) observer.disconnect();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
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

      {/* "You" tag, anchored to the marker via cobe's CSS anchor positioning */}
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
            color: "var(--color-accent-text)",
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

      {/* Arc amount tags, colored like every other balance */}
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
              color: m.amount >= 0 ? "var(--color-credit-text)" : "var(--color-debit-text)",
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