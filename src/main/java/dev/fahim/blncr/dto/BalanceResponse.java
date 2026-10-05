package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.User;
import lombok.Builder;

import java.math.BigDecimal;

/** Positive netBalance: the group owes this user. Negative: this user owes the group. */
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