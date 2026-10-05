import { Link } from "react-router-dom";
import BackgroundFX from "./BackgroundFX";
import logo from "../assets/logo.svg";

export default function LegalLayout({ title, updated, children }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-base)]">
      <BackgroundFX />
      <div className="relative z-10">
        <header className="border-b border-[var(--color-border-soft)]">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="BLNCR" className="h-6 w-6" />
              <span className="text-sm font-semibold tracking-tight">BLNCR</span>
            </Link>
            <Link
              to="/"
              className="text-sm text-[var(--color-text-soft)] transition-colors hover:text-[var(--color-text)]"
            >
              Back to home
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {title}
          </h1>
          {updated && (
            <p className="mt-2 text-xs text-[var(--color-text-faint)]">Last updated: {updated}</p>
          )}
          <div className="legal-prose mt-8 flex flex-col gap-5 text-[15px] leading-relaxed text-[var(--color-text-soft)]">
            {children}
          </div>
        </main>

        <footer className="border-t border-[var(--color-border-soft)]">
          <div className="mx-auto max-w-3xl px-4 py-8 text-center text-xs text-[var(--color-text-faint)] sm:px-6">
            © {new Date().getFullYear()} BLNCR · MIT License
          </div>
        </footer>
      </div>
    </div>
  );
}