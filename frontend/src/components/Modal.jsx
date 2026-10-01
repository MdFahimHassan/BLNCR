import { useEffect, useId, useRef } from "react";
import { X } from "@phosphor-icons/react";

export default function Modal({ open, onClose, title, children, width = "max-w-md" }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    const getFocusable = () => [...dialogRef.current.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => element.getAttribute("aria-hidden") !== "true");
    const focusable = getFocusable();
    (dialogRef.current.querySelector("[autofocus]") ?? focusable[0] ?? dialogRef.current).focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const currentFocusable = getFocusable();
      if (!currentFocusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
      } else if (event.shiftKey && document.activeElement === currentFocusable[0]) {
        event.preventDefault();
        currentFocusable[currentFocusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === currentFocusable[currentFocusable.length - 1]) {
        event.preventDefault();
        currentFocusable[0].focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-sm animate-[fade-in_0.15s_var(--ease-snap)]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`w-full ${width} max-h-[85vh] overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl animate-[modal-in_0.18s_var(--ease-snap)]`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
          <h2 id={titleId} className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
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