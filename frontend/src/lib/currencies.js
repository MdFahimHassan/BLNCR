// Currencies a group can use. Keep in sync with SupportedCurrencies.java on the backend.
// `narrow: true` = show the short symbol (৳, RM, ฿ ...) instead of the bare ISO code.
export const DEFAULT_CURRENCY = "USD";

export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "BDT", name: "Bangladeshi Taka", narrow: true },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "INR", name: "Indian Rupee" },
  { code: "PKR", name: "Pakistani Rupee", narrow: true },
  { code: "LKR", name: "Sri Lankan Rupee", narrow: true },
  { code: "NPR", name: "Nepalese Rupee", narrow: true },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "MYR", name: "Malaysian Ringgit", narrow: true },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "THB", name: "Thai Baht", narrow: true },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "TRY", name: "Turkish Lira" },
];

const byCode = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

export function currencyInfo(code) {
  return byCode[code] ?? byCode[DEFAULT_CURRENCY];
}