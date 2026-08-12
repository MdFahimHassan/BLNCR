package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.User;
import lombok.Builder;

import java.math.BigDecimal;

/**
 * A user's net position in a group. Positive {@code netBalance} means the group owes them
 * money overall (net creditor); negative means they owe the group money overall (net debtor).
 */
@Builder
public record BalanceResponse(
        Long userId,
        String name,
        BigDecimal netBalance
) {
    public static BalanceResponse of(User user, BigDecimal netBalance) {
        return BalanceResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .netBalance(netBalance)
                .build();
    }
}