package dev.fahim.blncr.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * One participant's entry in a split. {@code value} depends on the split type: ignored for EQUAL,
 * the exact amount owed for EXACT, the percentage owed for PERCENTAGE. Bounds keep absurd values out of
 * the BigDecimal math in SplitCalculator.
 */
public record ExpenseSplitInput(

        @NotNull(message = "Each split entry must specify a userId")
        Long userId,

        @DecimalMin(value = "0", message = "Split values cannot be negative")
        @DecimalMax(value = "1000000000", message = "Split value is too large")
        @Digits(integer = 10, fraction = 6, message = "Split value has too many decimal places")
        BigDecimal value
) {}
