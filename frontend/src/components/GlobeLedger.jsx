import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";
import { useTheme } from "../context/ThemeContext";

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
//
// The ocean stays transparent either way (dark:1 never changes), so on a
// light page it's the dots that would go invisible if left bright — the
// exact same near-white-on-white problem, mirrored, so light mode uses a
// dark charcoal base instead. A near-black base needs its own brightness/
// diffuse tuning though, not just the dark-theme numbers reused: mapBrightness
// multiplies the base color, so a color that's already close to 0 barely
// moves no matter what diffuse does — the dots go flat/matte instead of
// showing the lit-vs-shadow falloff that reads as a "prominent, dotted
// sphere" instead of a solid disc. Light mode's brightness/diffuse are
// pushed up specifically to restore that range on a dark base.
const GLOBE_COLORS = {
  dark: { base: [0.92, 0.94, 0.9], glow: [0.22, 0.26, 0.11], brightness: 4, diffuse: 3 },
  light: { base: [0.16, 0.17, 0.19], glow: [0.82, 0.83, 0.8], brightness: 7, diffuse: 4.5 },
};

const IDLE_PHI_SPEED = 0.02; // baseline auto-rotate speed when untouched
const FRICTION = 0.94; // per-frame velocity decay after release — higher = coasts longer
const THETA_LIMIT = 1.3; // radians (~74°) — stops the drag short of flipping the globe upside down

// Ambient, self-triggered motion (the idle auto-spin) is what
// prefers-reduced-motion asks sites to drop — dragging remains available
// since that's motion the user directly asked for, not motion happening to
// them. HeroCardArc already respects this; the globe previously didn't.
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

  // Current absolute view angles, mutated directly by both dragging and the
  // momentum/idle loop — there's no "rest" state to snap back to, wherever
  // this ends up is where it stays.
  const rotationRef = useRef({ phi: 0, theta: 0.28 });
  // Angular velocity per frame. phi starts at the idle speed so it's already
  // auto-rotating before anyone touches it (unless reduced-motion is on,
  // where it starts and stays at rest until dragged); theta starts at 0.
  const velocityRef = useRef({ phi: REST_IDLE_PHI_SPEED, theta: 0 });
  const pointerRef = useRef(null); // last pointer {x, y} while dragging
  const isDraggingRef = useRef(false);
  // Read fresh every frame by the render loop below, rather than baked into
  // the globe at creation — lets baseColor/glowColor/brightness/diffuse
  // update live on a theme flip via globe.update() (a cheap uniform change)
  // instead of tearing down and recreating the whole WebGL globe, which is
  // what a `[theme]` dependency on the main effect used to do and was the
  // actual source of the toggle-animation jank when the globe was on screen.
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
    // Starts true so the first frame() call (from init(), below) schedules
    // normally; the IntersectionObserver below corrects this immediately if
    // the canvas actually mounted off-screen.
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

    // Hoisted out of init() (rather than declared as a nested function
    // inside it, as cobe's own demo does) so the IntersectionObserver below
    // — which lives outside init()'s scope — can also call it to resume the
    // loop after it's been stopped by scrolling off-screen.
    function frame() {
      if (cancelled || !globe) return;

      // Same reasoning as the LedgerPreview tween freeze: this fires a real
      // WebGL draw call every frame, which is exactly the kind of ongoing
      // GPU work that competes with the browser's own compositing of the
      // theme-toggle wipe. Skipping the draw (not the rAF scheduling) for
      // the transition's brief duration means the globe just holds its
      // current frame — imperceptible — instead of fighting the wipe for
      // frame time.
      if (document.documentElement.classList.contains("vt-transitioning")) {
        frameId = isVisible ? requestAnimationFrame(frame) : null;
        return;
      }

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
        // the gentle idle auto-spin instead of drifting to a dead stop —
        // or, under reduced-motion, ease back to a full stop instead.
        if (Math.abs(velocityRef.current.phi) < IDLE_PHI_SPEED * 1.5) {
          velocityRef.current.phi += (REST_IDLE_PHI_SPEED - velocityRef.current.phi) * 0.01;
        }
        if (Math.abs(velocityRef.current.theta) < 0.0002) {
          velocityRef.current.theta = 0;
        }
      }
      // While dragging, handlePointerMove above already wrote the latest
      // phi/theta directly into rotationRef — nothing to do here but read it.

      globe.update({
        phi: rotationRef.current.phi,
        theta: rotationRef.current.theta,
        baseColor: themeConfigRef.current.base,
        glowColor: themeConfigRef.current.glow,
        diffuse: themeConfigRef.current.diffuse,
        mapBrightness: themeConfigRef.current.brightness,
      });

      // Scrolled off-screen: stop scheduling frames entirely (no rAF churn,
      // no GPU work) rather than continuing to spin an invisible globe.
      // The observer below calls frame() again once it re-enters view.
      frameId = isVisible ? requestAnimationFrame(frame) : null;
    }

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
        diffuse: themeConfigRef.current.diffuse,
        mapSamples: 16000,
        mapBrightness: themeConfigRef.current.brightness,
        // Small floor so the very first frame or two (drawn before the
        // embedded map texture has finished decoding) still show *something*
        // instead of a blank sphere.
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

      // cobe v2 removed the old onRender-callback API — createGlobe() now
      // renders exactly one frame at creation and never again on its own.
      // Driving rotation means calling globe.update() ourselves, every frame
      // (frame() defined above, outside init — see comment there for why).
      frame();
    }

    requestAnimationFrame(init);

    let observer = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
          // Loop had stopped itself (frameId null) while off-screen —
          // restart it now that it's back in view.
          if (isVisible && frameId === null && globe) frame();
        },
        { rootMargin: "100px" }
      );
      observer.observe(canvas);
    }

    // cobe sizes its internal render target once, at createGlobe() time —
    // it never re-reads the canvas's CSS size on its own. Without this, a
    // phone rotation or a resized browser window leaves the *element*
    // filling its new container correctly (that part is just CSS), but the
    // actual rendered globe stays locked to its original resolution and
    // gets stretched to fit — noticeably softer/blurrier, not broken, but
    // not sharp either. globe.update() accepts new width/height directly
    // (cobe v2), so this just re-measures and pushes the new size in,
    // rather than tearing down and recreating the whole globe.
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
    // Mount once — theme changes are now handled live inside frame() via
    // themeConfigRef (see above) rather than by tearing down and recreating
    // the WebGL globe, which used to happen here and was the main cause of
    // the toggle animation stuttering whenever this section was on screen.
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