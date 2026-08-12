package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.CreateExpenseRequest;
import dev.fahim.blncr.dto.ExpenseResponse;
import dev.fahim.blncr.dto.ExpenseSplitInput;
import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.ExpenseSplit;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.ExpenseSplitRepository;
import dev.fahim.blncr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final UserRepository userRepository;
    private final GroupAccessService groupAccessService;
    private final SplitCalculator splitCalculator;

    @Transactional
    public ExpenseResponse addExpense(Long groupId, Long requesterId, CreateExpenseRequest request) {
        Group group = groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireMembership(groupId, requesterId);

        User paidBy = userRepository.findById(request.paidByUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + request.paidByUserId()));
        if (!groupAccessService.isMember(groupId, paidBy.getId())) {
            throw new NotGroupMemberException("The payer must be a member of this group");
        }

        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);

        Map<Long, BigDecimal> owedByUserId = switch (request.splitType()) {
            case EQUAL -> splitCalculator.calculateEqual(amount, extractUserIds(request.splits()));
            case EXACT -> splitCalculator.calculateExact(amount, request.splits());
            case PERCENTAGE -> splitCalculator.calculatePercentage(amount, request.splits());
        };

        Map<Long, User> membersById = groupAccessService.getMembers(groupId).stream()
                .map(GroupMember::getUser)
                .collect(Collectors.toMap(User::getId, u -> u));

        for (Long userId : owedByUserId.keySet()) {
            if (!membersById.containsKey(userId)) {
                throw new InvalidRequestException("User " + userId + " is not a member of this group");
            }
        }

        Expense expense = Expense.builder()
                .group(group)
                .paidBy(paidBy)
                .amount(amount)
                .description(request.description().trim())
                .splitType(request.splitType())
                .createdAt(LocalDateTime.now())
                .build();
        Expense saved = expenseRepository.save(expense);

        List<ExpenseSplit> splits = owedByUserId.entrySet().stream()
                .map(entry -> ExpenseSplit.builder()
                        .expense(saved)
                        .user(membersById.get(entry.getKey()))
                        .amountOwed(entry.getValue())
                        .build())
                .toList();
        expenseSplitRepository.saveAll(splits);

        return ExpenseResponse.from(saved, splits);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(Long groupId, Long requesterId) {
        groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireMembership(groupId, requesterId);

        return expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(expense -> ExpenseResponse.from(expense, expenseSplitRepository.findByExpenseId(expense.getId())))
                .toList();
    }

    private List<Long> extractUserIds(List<ExpenseSplitInput> splits) {
        return splits.stream().map(ExpenseSplitInput::userId).toList();
    }
}