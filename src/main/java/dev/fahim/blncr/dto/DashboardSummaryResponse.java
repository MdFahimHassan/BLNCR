package dev.fahim.blncr.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardSummaryResponse(
        List<GroupResponse> groups,
        Map<Long, BigDecimal> netBalances
) {
}