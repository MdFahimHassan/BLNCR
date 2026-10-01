package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.ExpenseCategory;
import dev.fahim.blncr.entity.Settlement;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A single chronological entry in a group's activity feed. {@code type} is either
 * {@code "EXPENSE"} or {@code "SETTLEMENT"}.
 * <p>
 * For an EXPENSE: {@code primaryUser} is who paid; {@code secondaryUser} is unused (null).
 * For a SETTLEMENT: {@code primaryUser} is who paid; {@code secondaryUser} is who received it.
 */
@Builder
public record ActivityItem(
        String type,
        Long id,
        String description,
        BigDecimal amount,
        ExpenseCategory category,
        Long primaryUserId,
        String primaryUserName,
        Long secondaryUserId,
        String secondaryUserName,
        Instant timestamp
) {
    public static ActivityItem fromExpense(Expense expense) {
        return ActivityItem.builder()
                .type("EXPENSE")
                .id(expense.getId())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .category(expense.getCategory())
                .primaryUserId(expense.getPaidBy().getId())
                .primaryUserName(expense.getPaidBy().getName())
                .timestamp(expense.getCreatedAt())
                .build();
    }

    public static ActivityItem fromSettlement(Settlement settlement) {
        return ActivityItem.builder()
                .type("SETTLEMENT")
                .id(settlement.getId())
                .description(settlement.getFromUser().getName() + " paid " + settlement.getToUser().getName())
                .amount(settlement.getAmount())
                .primaryUserId(settlement.getFromUser().getId())
                .primaryUserName(settlement.getFromUser().getName())
                .secondaryUserId(settlement.getToUser().getId())
                .secondaryUserName(settlement.getToUser().getName())
                .timestamp(settlement.getSettledAt())
                .build();
    }
}