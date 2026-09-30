package dev.fahim.blncr.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * One participant's entry in a split.
 * <p>
 * {@code value} is interpreted based on the expense's {@code splitType}:
 * <ul>
 *     <li>EQUAL — ignored; only {@code userId} matters (the set of people splitting the bill)</li>
 *     <li>EXACT — the exact amount this user owes; all values must sum to the expense total</li>
 *     <li>PERCENTAGE — the percentage this user owes; all values must sum to 100</li>
 * </ul>
 * Bounds keep absurd values (huge magnitudes / thousands of decimals) from reaching the
 * BigDecimal arithmetic in SplitCalculator.
 */
public record ExpenseSplitInput(

        @NotNull(message = "Each split entry must specify a userId")
        Long userId,

        @DecimalMin(value = "0", message = "Split values cannot be negative")
        @DecimalMax(value = "1000000000", message = "Split value is too large")
        @Digits(integer = 10, fraction = 6, message = "Split value has too many decimal places")
        BigDecimal value
) {}
