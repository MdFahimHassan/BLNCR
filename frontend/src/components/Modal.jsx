import { useEffect } from "react";
import { X } from "@phosphor-icons/react";

export default function Modal({ open, onClose, title, children, width = "max-w-md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-sm animate-[fade-in_0.15s_var(--ease-snap)]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${width} max-h-[85vh] overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl animate-[modal-in_0.18s_var(--ease-snap)]`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md text-[var(--color-text-faint)] transition-[color,transform] duration-150 [transition-timing-function:var(--ease-snap)] hover:text-[var(--color-text)] active:scale-90 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}