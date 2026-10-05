package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.ExpenseSplit;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ExpenseSplitResponse(
        Long userId,
        String name,
        BigDecimal amountOwed
) {
    public static ExpenseSplitResponse from(ExpenseSplit split) {
        return ExpenseSplitResponse.builder()
                .userId(split.getUser().getId())
                .name(split.getUser().getName())
                .amountOwed(split.getAmountOwed())
                .build();
    }
}