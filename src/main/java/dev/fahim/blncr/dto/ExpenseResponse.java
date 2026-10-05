package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.ExpenseSplit;
import dev.fahim.blncr.entity.SplitType;
import dev.fahim.blncr.entity.ExpenseCategory;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Builder
public record ExpenseResponse(
        Long id,
        Long groupId,
        String description,
        BigDecimal amount,
        Long paidByUserId,
        String paidByName,
        Long createdByUserId,
        SplitType splitType,
        ExpenseCategory category,
        Instant createdAt,
        List<ExpenseSplitResponse> splits
) {
    public static ExpenseResponse from(Expense expense, List<ExpenseSplit> splits) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .groupId(expense.getGroup().getId())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .paidByUserId(expense.getPaidBy().getId())
                .paidByName(expense.getPaidBy().getName())
                .createdByUserId(expense.getCreatedBy() == null ? null : expense.getCreatedBy().getId())
                .splitType(expense.getSplitType())
                .category(expense.getCategory())
                .createdAt(expense.getCreatedAt())
                .splits(splits.stream().map(ExpenseSplitResponse::from).toList())
                .build();
    }
}