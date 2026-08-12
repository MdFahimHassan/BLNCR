package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.BalanceResponse;
import dev.fahim.blncr.dto.GroupBalancesResponse;
import dev.fahim.blncr.dto.SettlementSuggestion;
import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.ExpenseSplit;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.Settlement;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.ExpenseSplitRepository;
import dev.fahim.blncr.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BalanceService {

    /** Balances within half a cent of zero are treated as settled, to absorb rounding noise. */
    private static final BigDecimal EPSILON = new BigDecimal("0.005");

    private final GroupAccessService groupAccessService;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final SettlementRepository settlementRepository;

    @Transactional(readOnly = true)
    public GroupBalancesResponse getBalances(Long groupId, Long requesterId) {
        groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireMembership(groupId, requesterId);

        List<GroupMember> members = groupAccessService.getMembers(groupId);
        Map<Long, User> usersById = new LinkedHashMap<>();
        Map<Long, BigDecimal> net = new LinkedHashMap<>();
        for (GroupMember member : members) {
            usersById.put(member.getUser().getId(), member.getUser());
            net.put(member.getUser().getId(), BigDecimal.ZERO);
        }

        // Expenses: the payer is credited the full amount, each split participant is debited their share.
        for (Expense expense : expenseRepository.findByGroupId(groupId)) {
            net.merge(expense.getPaidBy().getId(), expense.getAmount(), BigDecimal::add);
            for (ExpenseSplit split : expenseSplitRepository.findByExpenseId(expense.getId())) {
                net.merge(split.getUser().getId(), split.getAmountOwed(), BigDecimal::subtract);
            }
        }

        // Settlements: paying off a debt moves the payer's balance up and the payee's balance down.
        for (Settlement settlement : settlementRepository.findByGroupId(groupId)) {
            net.merge(settlement.getFromUser().getId(), settlement.getAmount(), BigDecimal::add);
            net.merge(settlement.getToUser().getId(), settlement.getAmount(), BigDecimal::subtract);
        }

        List<BalanceResponse> balances = usersById.values().stream()
                .map(user -> BalanceResponse.of(
                        user,
                        net.getOrDefault(user.getId(), BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP)))
                .toList();

        List<SettlementSuggestion> suggestions = simplifyDebts(net, usersById);

        return GroupBalancesResponse.builder()
                .balances(balances)
                .suggestedSettlements(suggestions)
                .build();
    }

    /**
     * Debt-simplification algorithm: repeatedly matches the largest net creditor with the
     * largest net debtor and settles the smaller of the two amounts between them. This greedy
     * "largest first" strategy minimizes the number of person-to-person transactions needed to
     * zero out the whole group, instead of everyone settling every pairwise debt individually.
     */
    private List<SettlementSuggestion> simplifyDebts(Map<Long, BigDecimal> netBalances, Map<Long, User> usersById) {
        List<MutableBalance> creditors = new ArrayList<>();
        List<MutableBalance> debtors = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : netBalances.entrySet()) {
            BigDecimal amount = entry.getValue();
            if (amount.compareTo(EPSILON) > 0) {
                creditors.add(new MutableBalance(entry.getKey(), amount));
            } else if (amount.compareTo(EPSILON.negate()) < 0) {
                debtors.add(new MutableBalance(entry.getKey(), amount.abs()));
            }
        }
        creditors.sort(Comparator.comparing((MutableBalance b) -> b.amount).reversed());
        debtors.sort(Comparator.comparing((MutableBalance b) -> b.amount).reversed());

        List<SettlementSuggestion> result = new ArrayList<>();
        int i = 0;
        int j = 0;
        while (i < creditors.size() && j < debtors.size()) {
            MutableBalance creditor = creditors.get(i);
            MutableBalance debtor = debtors.get(j);
            BigDecimal settleAmount = creditor.amount.min(debtor.amount).setScale(2, RoundingMode.HALF_UP);

            if (settleAmount.compareTo(BigDecimal.ZERO) > 0) {
                User from = usersById.get(debtor.userId);
                User to = usersById.get(creditor.userId);
                result.add(SettlementSuggestion.of(from, to, settleAmount));
            }

            creditor.amount = creditor.amount.subtract(settleAmount);
            debtor.amount = debtor.amount.subtract(settleAmount);

            if (creditor.amount.compareTo(EPSILON) <= 0) {
                i++;
            }
            if (debtor.amount.compareTo(EPSILON) <= 0) {
                j++;
            }
        }
        return result;
    }

    private static final class MutableBalance {
        private final Long userId;
        private BigDecimal amount;

        private MutableBalance(Long userId, BigDecimal amount) {
            this.userId = userId;
            this.amount = amount;
        }
    }
}