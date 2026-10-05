// Client-side email check for instant feedback only; the server is the authority.
// Keep the reserved lists in sync with ValidEmailValidator.java.

const EMAIL_RE =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,24}|xn--[A-Za-z0-9-]{1,59})$/;

// Reserved / non-routable TLDs (RFC 2606, 6761, 6762) and documentation domains.
const BLOCKED_TLDS = new Set([
  "test", "example", "invalid", "localhost", "local", "localdomain",
  "internal", "lan", "home", "corp", "onion",
]);
const BLOCKED_DOMAINS = ["example.com", "example.net", "example.org"];

export function isValidEmail(value) {
  const email = (value || "").trim();
  if (email.length > 254 || !EMAIL_RE.test(email)) return false;
  const at = email.lastIndexOf("@");
  if (at < 1 || at > 64) return false;
  const domain = email.slice(at + 1).toLowerCase();
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  if (BLOCKED_TLDS.has(tld)) return false;
  return !BLOCKED_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
}
