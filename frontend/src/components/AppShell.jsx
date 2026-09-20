import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignOut, CaretDown } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--color-base)]">
      <header className="sticky top-0 z-30 border-b border-[var(--color-border-soft)] bg-[var(--color-base)]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[var(--color-accent)] text-[11px] font-bold text-[var(--color-accent-ink)]">
              B
            </span>
            <span className="text-sm font-semibold tracking-tight">BLNCR</span>
          </Link>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Avatar name={user.name} id={user.id} size="sm" />
                <span className="hidden text-sm text-[var(--color-text-soft)] sm:inline">
                  {user.name}
                </span>
                <CaretDown size={12} className="text-[var(--color-text-faint)]" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 shadow-xl">
                    <div className="border-b border-[var(--color-border-soft)] px-3.5 py-2">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-[var(--color-text-faint)]">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-[var(--color-debit)] hover:bg-[var(--color-debit-soft)] transition-colors"
                    >
                      <SignOut size={15} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}