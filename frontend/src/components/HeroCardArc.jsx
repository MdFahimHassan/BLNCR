import { useEffect, useState } from "react";
import heroCard from "../assets/hero-card.webp";

// One card image, cloned and rotated in CSS at five angles along a shallow arc —
// no video, no per-frame assets, fully theme-able and cheap to animate.
const CARDS = [
  { x: -370, y: 74, rotY: -34, rotZ: -7, scale: 0.76, z: 10, delay: 0 },
  { x: -182, y: 22, rotY: -17, rotZ: -3.5, scale: 0.9, z: 20, delay: 90 },
  { x: 0, y: -6, rotY: 0, rotZ: 0, scale: 1.04, z: 30, delay: 180 },
  { x: 182, y: 22, rotY: 17, rotZ: 3.5, scale: 0.9, z: 20, delay: 90 },
  { x: 370, y: 74, rotY: 34, rotZ: 7, scale: 0.76, z: 10, delay: 0 },
];

export default function HeroCardArc() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative mx-auto mt-4 h-[300px] w-full max-w-[1040px] scale-[0.62] sm:h-[360px] sm:scale-[0.82] lg:h-[420px] lg:scale-100">
      {/* Horizon glow — soft overlapping radial fields only, no hard ring edges */}
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
        {CARDS.map((c, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 transition-[transform,opacity] duration-[900ms] [transition-timing-function:var(--ease-snap)]"
            style={{
              zIndex: c.z,
              opacity: mounted ? 1 : 0,
              transform: mounted
                ? `translate(-50%, -50%) translate(${c.x}px, ${c.y}px) rotateY(${c.rotY}deg) rotateZ(${c.rotZ}deg) scale(${c.scale})`
                : `translate(-50%, -50%) translate(${c.x}px, ${c.y + 46}px) rotateY(${c.rotY}deg) rotateZ(${c.rotZ}deg) scale(${c.scale * 0.94})`,
              transitionDelay: `${c.delay}ms`,
            }}
          >
            <div
              style={{
                animation: mounted ? `hero-card-float 6s ease-in-out ${c.delay + 400}ms infinite` : "none",
              }}
            >
              <img
                src={heroCard}
                alt=""
                draggable={false}
                className="w-[260px] select-none drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}