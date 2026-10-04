import { useEffect, useMemo, useRef, useState } from "react";
import card1 from "../assets/card-1.webp";
import card2 from "../assets/card-2.webp";
import card3 from "../assets/card-3.webp";
import card4 from "../assets/card-4.webp";
import card5 from "../assets/card-5.webp";

// Five cards on a tilted ring of fixed slots; each tick the whole ring advances one slot.
const CARD_IMAGES = [card1, card2, card3, card4, card5];

// x uses a wider radius than the depth math, so the back cards peek out from behind the front-side cards.
const RADIUS = 320;
const ROTATE_MS = 2400;
const TRANSITION_MS = 1000;
// Ease-in-out reads smoother than an ease-out snap for a motion that repeats every couple of seconds.
const EASE = "cubic-bezier(0.45, 0, 0.15, 1)";

// Slot angles in degrees, front-center at 0°.
const ANGLES = [-144, -72, 0, 72, 144];

// Slot geometry is derived from the angles with sin/cos, so nothing is hardcoded.
const SLOTS = ANGLES.map((deg) => {
  const theta = (deg * Math.PI) / 180;
  const x = RADIUS * Math.sin(theta);
  const depth = Math.cos(theta);
  const t = (depth + 1) / 2; // 0 = back slots, 1 = front-center
  const scale = 0.5 + t * 0.58;
  const opacity = 0.3 + t * 0.7;
  const y = (0.5 - t) * 46; // front rides up, back sinks down
  const zIndex = Math.round(t * 100);
  const brightness = 0.6 + t * 0.6;
  const shadowBlur = 20 + t * 60;
  const shadowSpread = 10 + t * 40;
  const shadowAlpha = 0.35 + t * 0.35;
  const glowBlur = 20 + t * 80;
  const glowAlpha = t * 0.4;
  const boxShadow = `0 ${shadowSpread}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha.toFixed(2)}), 0 0 ${glowBlur}px rgba(215,255,62,${glowAlpha.toFixed(2)})`;

  return { x, y, t, scale, opacity, zIndex, filter: `brightness(${brightness.toFixed(2)})`, boxShadow };
});

export default function HeroCardArc() {
  const [mounted, setMounted] = useState(false);
  // order[slotIndex] = which card image index currently occupies that slot.
  const [order, setOrder] = useState([0, 1, 2, 3, 4]);
  const intervalRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    intervalRef.current = setInterval(() => {
      if (document.documentElement.classList.contains("vt-transitioning")) return;
      setOrder((prev) => [prev[4], prev[0], prev[1], prev[2], prev[3]]);
    }, ROTATE_MS);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Iterate a fixed card sequence rather than `order`, so React never reorders DOM nodes (which would skip their CSS transitions).
  const slotOf = useMemo(() => {
    const inverse = new Array(5);
    order.forEach((cardIndex, slotIndex) => {
      inverse[cardIndex] = slotIndex;
    });
    return inverse;
  }, [order]);

  return (
    // The outer wrapper reserves the scaled height in page flow; the inner box keeps its original size so the pixel-offset glows stay put.
    <div className="relative mx-auto mt-4 flex h-[186px] w-full max-w-[1040px] items-center justify-center overflow-visible sm:h-[295px] lg:h-[420px]">
      <div className="relative h-[300px] w-full shrink-0 scale-[0.62] sm:h-[360px] sm:scale-[0.82] lg:h-[420px] lg:scale-100">
        {/* Horizon glow: soft overlapping radial fields, no hard ring edges */}
        <div
          className="pointer-events-none absolute bottom-[-70px] left-1/2 h-[360px] w-[1160px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(closest-side, rgba(215,255,62,0.30) 0%, rgba(215,255,62,0.10) 42%, transparent 74%)",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-[-16px] left-1/2 h-[110px] w-[760px] -translate-x-1/2 rounded-full blur-2xl"
          style={{ background: "radial-gradient(closest-side, rgba(215,255,62,0.38), transparent 78%)" }}
        />

        <div className="absolute inset-0" style={{ perspective: "1500px" }}>
          {CARD_IMAGES.map((img, cardIndex) => {
            const s = SLOTS[slotOf[cardIndex]];
            return (
              <div
                key={cardIndex}
                className="absolute left-1/2 top-1/2 transition-[transform,opacity,filter,box-shadow]"
                style={{
                  zIndex: s.zIndex,
                  opacity: mounted ? s.opacity : 0,
                  filter: s.filter,
                  boxShadow: s.boxShadow,
                  willChange: "transform, opacity, filter",
                  transform: mounted
                    ? `translate(-50%, -50%) translate(${s.x}px, ${s.y}px) scale(${s.scale})`
                    : `translate(-50%, -50%) translate(${s.x}px, ${s.y + 20}px) scale(${s.scale * 0.94})`,
                  transitionDuration: `${TRANSITION_MS}ms`,
                  transitionTimingFunction: EASE,
                }}
              >
                <img
                  src={img}
                  alt=""
                  draggable={false}
                  className="w-[220px] select-none rounded-lg"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}