package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.Settlement;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Builder
public record SettlementResponse(
        Long id,
        Long groupId,
        Long fromUserId,
        String fromName,
        Long toUserId,
        String toName,
        BigDecimal amount,
        LocalDateTime settledAt
) {
    public static SettlementResponse from(Settlement settlement) {
        return SettlementResponse.builder()
                .id(settlement.getId())
                .groupId(settlement.getGroup().getId())
                .fromUserId(settlement.getFromUser().getId())
                .fromName(settlement.getFromUser().getName())
                .toUserId(settlement.getToUser().getId())
                .toName(settlement.getToUser().getName())
                .amount(settlement.getAmount())
                .settledAt(settlement.getSettledAt())
                .build();
    }
}