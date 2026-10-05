import { CircleNotch } from "@phosphor-icons/react";

export function Spinner({ size = 20, className = "" }) {
  return <CircleNotch size={size} className={`animate-spin text-[var(--color-text-faint)] ${className}`} />;
}

export function PageSpinner({ label = "Loading" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-[var(--color-text-faint)]">
      <Spinner size={22} />
      <p className="text-sm">{label}…</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-faint)]">
          <Icon size={20} />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
        {description && (
          <p className="max-w-xs text-sm text-[var(--color-text-faint)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}