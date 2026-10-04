package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.User;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record SettlementSuggestion(
        Long fromUserId,
        String fromName,
        Long toUserId,
        String toName,
        BigDecimal amount
) {
    public static SettlementSuggestion of(User from, User to, BigDecimal amount) {
        return SettlementSuggestion.builder()
                .fromUserId(from.getId())
                .fromName(from.getName())
                .toUserId(to.getId())
                .toName(to.getName())
                .amount(amount)
                .build();
    }
}