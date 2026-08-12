package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.User;
import lombok.Builder;

import java.math.BigDecimal;

/**
 * One transaction in the simplified settle-up plan: {@code fromUser} should pay
 * {@code toUser} the given {@code amount} to help zero out the group's debts using
 * the fewest possible transactions.
 */
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