package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.ActivityItem;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final GroupAccessService groupAccessService;
    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;

    @Transactional(readOnly = true)
    public List<ActivityItem> getActivity(Long groupId, Long requesterId) {
        groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireMembership(groupId, requesterId);

        Stream<ActivityItem> expenseActivity = expenseRepository.findByGroupId(groupId).stream()
                .map(ActivityItem::fromExpense);
        Stream<ActivityItem> settlementActivity = settlementRepository.findByGroupId(groupId).stream()
                .map(ActivityItem::fromSettlement);

        return Stream.concat(expenseActivity, settlementActivity)
                .sorted(Comparator.comparing(ActivityItem::timestamp).reversed())
                .toList();
    }
}