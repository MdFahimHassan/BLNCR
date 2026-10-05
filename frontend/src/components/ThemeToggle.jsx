import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] transition-colors duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] ${className}`}
    >
      <span className="relative block h-4 w-4">
        <Sun
          size={16}
          weight="bold"
          className={`absolute inset-0 transition-[opacity,transform] duration-300 [transition-timing-function:var(--ease-snap)] ${
            isLight ? "rotate-0 scale-100 opacity-100" : "rotate-45 scale-50 opacity-0"
          }`}
        />
        <Moon
          size={16}
          weight="bold"
          className={`absolute inset-0 transition-[opacity,transform] duration-300 [transition-timing-function:var(--ease-snap)] ${
            isLight ? "-rotate-45 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </span>
    </button>
  );
}