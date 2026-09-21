import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = "error") => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const toast = {
    error: (message) => push(message, "error"),
    success: (message) => push(message, "success"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-2.5 rounded-[var(--radius-card)] border px-4 py-3 shadow-lg backdrop-blur-sm animate-[toast-in_0.2s_var(--ease-snap)] ${
              t.variant === "success"
                ? "bg-[var(--color-credit-soft)] border-[var(--color-credit)]/30 text-[var(--color-credit)]"
                : "bg-[var(--color-debit-soft)] border-[var(--color-debit)]/30 text-[var(--color-debit)]"
            }`}
          >
            {t.variant === "success" ? (
              <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
            ) : (
              <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
            )}
            <p className="text-sm leading-snug flex-1 text-[var(--color-text)]">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}