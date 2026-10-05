import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignOut, CaretDown, UserCircle } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import BackgroundFX from "./BackgroundFX";
import ThemeToggle from "./ThemeToggle";
import ProfileEditor from "./ProfileEditor";
import logo from "../assets/logo.svg";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-[var(--color-base)]">
      <BackgroundFX />
      <header className="relative z-30 sticky top-0 border-b border-[var(--color-border-soft)] bg-[var(--color-base)]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="BLNCR" className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-tight">BLNCR</span>
          </Link>

          {user && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Open account menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <Avatar name={user.name} id={user.id} src={user.avatar} size="sm" />
                  <span className="hidden text-sm text-[var(--color-text-soft)] sm:inline">
                    {user.name}
                  </span>
                  <CaretDown size={12} className="text-[var(--color-text-faint)]" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-60 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 shadow-xl">
                      <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] px-3.5 py-3">
                        <Avatar name={user.name} id={user.id} src={user.avatar} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{user.name}</p>
                          <p className="truncate text-xs text-[var(--color-text-faint)]">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setProfileOpen(true);
                        }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--color-text-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors"
                      >
                        <UserCircle size={16} />
                        Profile settings
                      </button>
                      <div className="mx-3.5 border-t border-[var(--color-border-soft)]" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-[var(--color-debit-text)] hover:bg-[var(--color-debit-soft)] transition-colors"
                      >
                        <SignOut size={15} />
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {user && <ProfileEditor open={profileOpen} onClose={() => setProfileOpen(false)} />}

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}