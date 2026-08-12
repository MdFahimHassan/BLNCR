package dev.fahim.blncr.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record GroupBalancesResponse(
        List<BalanceResponse> balances,
        List<SettlementSuggestion> suggestedSettlements
) {}