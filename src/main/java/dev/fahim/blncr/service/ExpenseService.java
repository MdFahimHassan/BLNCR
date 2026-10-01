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
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
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
        return addExpense(groupId, requesterId, request, null);
    }

    @Transactional
    public ExpenseResponse addExpense(
            Long groupId, Long requesterId, CreateExpenseRequest request, UUID idempotencyKey) {
        Group group = groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireMembership(groupId, requesterId);

        if (idempotencyKey != null) {
            Optional<Expense> existing = expenseRepository.findByCreatedByIdAndGroupIdAndIdempotencyKey(
                    requesterId, groupId, idempotencyKey);
            if (existing.isPresent()) {
                Expense expense = existing.get();
                return ExpenseResponse.from(expense, expenseSplitRepository.findByExpenseId(expense.getId()));
            }
        }

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

        Map<Long, User> membersById = groupAccessService.getActiveMembers(groupId).stream()
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
            .createdBy(membersById.get(requesterId))
            .idempotencyKey(idempotencyKey)
                .category(request.category())
                .amount(amount)
                .description(request.description().trim())
                .splitType(request.splitType())
                .createdAt(Instant.now())
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

    @Transactional
    public ExpenseResponse updateExpense(
            Long groupId, Long requesterId, Long expenseId, CreateExpenseRequest request) {
        groupAccessService.getGroupOrThrow(groupId);
        Expense expense = findExpense(groupId, expenseId);
        groupAccessService.requireExpenseManager(groupId, requesterId, expense);
        Map<Long, BigDecimal> owedByUserId = calculateSplits(request);
        Map<Long, User> membersById = activeMembersById(groupId);
        requireSplitMembers(owedByUserId, membersById);

        User paidBy = membersById.get(request.paidByUserId());
        if (paidBy == null) {
            throw new InvalidRequestException("The payer must be an active member of this group");
        }

        expense.setDescription(request.description().trim());
        expense.setAmount(request.amount().setScale(2, RoundingMode.HALF_UP));
        expense.setPaidBy(paidBy);
        expense.setSplitType(request.splitType());
        expense.setCategory(request.category());
        expenseSplitRepository.deleteByExpenseId(expenseId);
        expenseSplitRepository.flush();

        List<ExpenseSplit> splits = createSplits(expense, owedByUserId, membersById);
        expenseSplitRepository.saveAll(splits);
        return ExpenseResponse.from(expenseRepository.save(expense), splits);
    }

    @Transactional
    public void deleteExpense(Long groupId, Long requesterId, Long expenseId) {
        groupAccessService.getGroupOrThrow(groupId);
        Expense expense = findExpense(groupId, expenseId);
        groupAccessService.requireExpenseManager(groupId, requesterId, expense);
        expenseSplitRepository.deleteByExpenseId(expenseId);
        expenseSplitRepository.flush();
        expenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> listExpenses(Long groupId, Long requesterId) {
        groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireMembership(groupId, requesterId);

        List<Expense> expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
        if (expenses.isEmpty()) {
            return List.of();
        }

        List<Long> expenseIds = expenses.stream().map(Expense::getId).toList();
        Map<Long, List<ExpenseSplit>> splitsByExpense = expenseSplitRepository.findByExpenseIdIn(expenseIds).stream()
            .collect(Collectors.groupingBy(split -> split.getExpense().getId()));

        return expenses.stream()
            .map(expense -> ExpenseResponse.from(
                expense, splitsByExpense.getOrDefault(expense.getId(), List.of())))
                .toList();
    }

    private List<Long> extractUserIds(List<ExpenseSplitInput> splits) {
        return splits.stream().map(ExpenseSplitInput::userId).toList();
    }

    private Expense findExpense(Long groupId, Long expenseId) {
        return expenseRepository.findByIdAndGroupId(expenseId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
    }

    private Map<Long, BigDecimal> calculateSplits(CreateExpenseRequest request) {
        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
        return switch (request.splitType()) {
            case EQUAL -> splitCalculator.calculateEqual(amount, extractUserIds(request.splits()));
            case EXACT -> splitCalculator.calculateExact(amount, request.splits());
            case PERCENTAGE -> splitCalculator.calculatePercentage(amount, request.splits());
        };
    }

    private Map<Long, User> activeMembersById(Long groupId) {
        return groupAccessService.getActiveMembers(groupId).stream()
                .map(GroupMember::getUser)
                .collect(Collectors.toMap(User::getId, user -> user));
    }

    private void requireSplitMembers(Map<Long, BigDecimal> owedByUserId, Map<Long, User> membersById) {
        for (Long userId : owedByUserId.keySet()) {
            if (!membersById.containsKey(userId)) {
                throw new InvalidRequestException("User " + userId + " is not an active member of this group");
            }
        }
    }

    private List<ExpenseSplit> createSplits(
            Expense expense, Map<Long, BigDecimal> owedByUserId, Map<Long, User> membersById) {
        return owedByUserId.entrySet().stream()
                .map(entry -> ExpenseSplit.builder()
                        .expense(expense)
                        .user(membersById.get(entry.getKey()))
                        .amountOwed(entry.getValue())
                        .build())
                .toList();
    }
}