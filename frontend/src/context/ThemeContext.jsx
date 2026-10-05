import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

const ThemeContext = createContext(null);
const STORAGE_KEY = "blncr_theme";
const THEME_COLOR = { dark: "#0a0b0d", light: "#faf9f6" };

function getInitialTheme() {
  if (typeof document === "undefined") return "dark";
  // index.html's inline script already set the class pre-paint; read it back so the two never disagree.
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Keep the browser chrome (address bar color on mobile) in sync too.
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLOR[theme]);
  }, [theme]);

  const toggleTheme = useCallback(
    (event) => {
      const next = theme === "dark" ? "light" : "dark";
      const apply = () => {
        document.documentElement.classList.toggle("light", next === "light");
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* private browsing / storage disabled — theme still applies, just won't persist */
        }
        setTheme(next);
      };

      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // No View Transitions support (or motion is disabled) → plain instant swap.
      if (reduceMotion || typeof document.startViewTransition !== "function") {
        apply();
        return;
      }

      const rect = event?.currentTarget?.getBoundingClientRect?.();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // See index.css: this class drops the header blur and pauses the background animation during the transition, which keeps it smooth on phones.
      document.documentElement.classList.add("vt-transitioning");

      const transition = document.startViewTransition(() => flushSync(apply));

      transition.ready
        .then(() => {
          const anim = document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          );
          anim.finished
            .catch(() => {})
            .finally(() => {
              document.documentElement.classList.remove("vt-transitioning");
            });
        })
        .catch(() => {
          document.documentElement.classList.remove("vt-transitioning");
        });
    },
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}