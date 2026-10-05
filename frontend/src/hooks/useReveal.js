import { useEffect, useRef, useState } from "react";

/**
 * Reveals an element once when it scrolls into view.
 * - Fires only once (unobserves after reveal) — no re-triggering on scroll-up.
 * - Falls back to "already visible" if IntersectionObserver is unavailable
 *   or if the element is already on-screen at mount (avoids a flash of
 *   invisible content above the fold on tall/short viewports).
 *
 * @param {Object} [options]
 * @param {number} [options.threshold=0.15] - fraction of the element visible before revealing
 * @param {string} [options.rootMargin="0px 0px -10% 0px"] - reveal slightly before it's fully in view
 */
export default function useReveal({ threshold = 0.15, rootMargin = "0px 0px -10% 0px" } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, visible];
}