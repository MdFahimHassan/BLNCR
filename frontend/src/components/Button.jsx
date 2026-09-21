import { CircleNotch } from "@phosphor-icons/react";

const variants = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:bg-[var(--color-accent-dim)] disabled:opacity-40",
  secondary:
    "bg-[var(--color-surface-3)] text-[var(--color-text)] hover:bg-[var(--color-border-strong)] border border-[var(--color-border)] disabled:opacity-40",
  ghost:
    "bg-transparent text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] disabled:opacity-40",
  danger:
    "bg-transparent text-[var(--color-debit)] hover:bg-[var(--color-debit-soft)] border border-[var(--color-debit)]/30 disabled:opacity-40",
};

const sizes = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-5 py-3 gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  icon: Icon,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-[var(--radius-control)] font-medium transition-[background-color,color,transform] duration-150 [transition-timing-function:var(--ease-snap)] cursor-pointer active:scale-[0.97] disabled:active:scale-100 disabled:cursor-not-allowed whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <CircleNotch size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={16} weight="bold" />
      )}
      {children}
    </button>
  );
}