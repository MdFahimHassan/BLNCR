import { lazy, Suspense, useEffect, useRef, useState } from "react";

// cobe (WebGL globe renderer) is a real chunk of JS that has zero business
// being in the initial "/" bundle — it's the third section down the page.
// React.lazy() alone only defers *rendering*, not the network fetch: with
// GlobeLedger sitting in the JSX tree unconditionally, React would still
// kick off the import() the moment this component mounts, which for a page
// that mounts everything on load is effectively immediately. Gating the
// import itself behind IntersectionObserver means the chunk isn't even
// requested until the user has scrolled within ~400px of it.
const GlobeLedger = lazy(() => import("./GlobeLedger"));

// Same footprint GlobeLedger renders at (aspect-square, max 380px) — reserved
// up front so there's no layout shift when the real thing mounts in.
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

    // IntersectionObserver support is universal in evergreen browsers; on the
    // rare browser without it, just load eagerly rather than never loading.
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