package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.DashboardSummaryResponse;
import dev.fahim.blncr.dto.GroupResponse;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.GroupNetBalance;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final GroupService groupService;
    private final ExpenseRepository expenseRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(Long userId) {
        List<GroupResponse> groups = groupService.listMyGroups(userId);
        Map<Long, BigDecimal> netBalances = expenseRepository.findNetBalancesForUser(userId).stream()
                .collect(Collectors.toMap(
                        GroupNetBalance::getGroupId,
                        GroupNetBalance::getNetBalance,
                        (first, second) -> second,
                        LinkedHashMap::new));
        return new DashboardSummaryResponse(groups, netBalances);
    }
}