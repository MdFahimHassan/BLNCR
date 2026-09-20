export default function Field({ label, error, hint, className = "", children, htmlFor }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-[var(--color-text-soft)]">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-[var(--color-debit)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-faint)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function inputClasses(hasError) {
  return `w-full rounded-[var(--radius-control)] bg-[var(--color-surface-2)] border ${
    hasError ? "border-[var(--color-debit)]" : "border-[var(--color-border)]"
  } px-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-accent)]`;
}

export function Input({ error, className = "", ...rest }) {
  return <input className={`${inputClasses(!!error)} ${className}`} {...rest} />;
}

export function Select({ error, className = "", children, ...rest }) {
  return (
    <select className={`${inputClasses(!!error)} ${className}`} {...rest}>
      {children}
    </select>
  );
}