package dev.fahim.blncr.dto;

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
 */
public record ExpenseSplitInput(

        @NotNull(message = "Each split entry must specify a userId")
        Long userId,

        BigDecimal value
) {}