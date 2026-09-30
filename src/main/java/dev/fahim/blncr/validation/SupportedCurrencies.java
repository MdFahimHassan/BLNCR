package dev.fahim.blncr.validation;

import java.util.Set;

/**
 * The currencies a group can be created with. Amounts are stored as NUMERIC(19,2)
 * regardless of currency, so every amount is handled with 2 decimal places.
 */
public final class SupportedCurrencies {

    public static final String DEFAULT = "USD";

    private static final Set<String> CODES = Set.of(
            "USD", "BDT", "EUR", "GBP", "INR", "PKR", "LKR", "NPR",
            "AED", "SAR", "MYR", "SGD", "THB", "JPY", "CNY",
            "CAD", "AUD", "NZD", "CHF", "TRY"
    );

    private SupportedCurrencies() {}

    public static boolean isSupported(String code) {
        return code != null && CODES.contains(code);
    }

    /** Null/blank falls back to USD; otherwise trims and upper-cases. */
    public static String normalize(String code) {
        if (code == null || code.isBlank()) return DEFAULT;
        return code.trim().toUpperCase();
    }
}