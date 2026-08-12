package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.ExpenseSplit;
import dev.fahim.blncr.entity.SplitType;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder
public record ExpenseResponse(
        Long id,
        Long groupId,
        String description,
        BigDecimal amount,
        Long paidByUserId,
        String paidByName,
        SplitType splitType,
        LocalDateTime createdAt,
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
                .splitType(expense.getSplitType())
                .createdAt(expense.getCreatedAt())
                .splits(splits.stream().map(ExpenseSplitResponse::from).toList())
                .build();
    }
}