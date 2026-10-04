import { lazy, Suspense, useEffect, useRef, useState } from "react";

// cobe is a large chunk, so the import() is gated behind an IntersectionObserver and only fetched near the viewport.
const GlobeLedger = lazy(() => import("./GlobeLedger"));

// Same footprint as GlobeLedger, reserved to avoid layout shift.
function GlobePlaceholder() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[380px]"
      style={{ minHeight: 260 }}
      aria-hidden="true"
    />
  );
}

export default function LazyGlobeLedger(props) {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;
    const node = containerRef.current;
    if (!node) return;

    // No IntersectionObserver: load eagerly.
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" } // start the fetch well before it's on screen
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={containerRef}>
      {shouldLoad ? (
        <Suspense fallback={<GlobePlaceholder />}>
          <GlobeLedger {...props} />
        </Suspense>
      ) : (
        <GlobePlaceholder />
      )}
    </div>
  );
}