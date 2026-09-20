const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a BigDecimal-as-string/number into "$12.50". Always positive-signed display. */
export function formatMoney(value) {
  const n = Number(value ?? 0);
  return currencyFormatter.format(Math.abs(n));
}

/** Formats a signed balance with an explicit +/- prefix, e.g. "+$12.50" / "-$4.00". */
export function formatSignedMoney(value) {
  const n = Number(value ?? 0);
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${currencyFormatter.format(Math.abs(n))}`;
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Deterministic-ish avatar tint from a user id so the same person always gets the same hue. */
export function avatarHue(seed) {
  const n = typeof seed === "number" ? seed : String(seed ?? "").length;
  return (n * 47) % 360;
}