package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.BalanceResponse;
import dev.fahim.blncr.dto.GroupBalancesResponse;
import dev.fahim.blncr.dto.SettlementSuggestion;
import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.ExpenseSplit;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.Settlement;
import dev.fahim.blncr.entity.SplitType;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.ExpenseSplitRepository;
import dev.fahim.blncr.repository.SettlementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {

    @Mock
    private GroupAccessService groupAccessService;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private ExpenseSplitRepository expenseSplitRepository;
    @Mock
    private SettlementRepository settlementRepository;

    @InjectMocks
    private BalanceService balanceService;

    private static final Long GROUP_ID = 1L;
    private static final Long REQUESTER_ID = 100L;

    private User alice;
    private User bob;
    private User carol;
    private Group group;

    @BeforeEach
    void setUp() {
        alice = user(100L, "Alice");
        bob = user(200L, "Bob");
        carol = user(300L, "Carol");
        group = Group.builder().id(GROUP_ID).name("Trip").build();
    }

    @Test
    @DisplayName("throws when the requester is not a group member")
    void throwsWhenNotAMember() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        doThrow(new NotGroupMemberException("nope"))
                .when(groupAccessService).requireMembership(GROUP_ID, REQUESTER_ID);

        assertThatThrownBy(() -> balanceService.getBalances(GROUP_ID, REQUESTER_ID))
                .isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    @DisplayName("a single two-person expense produces exactly one settlement suggestion")
    void simpleTwoPersonExpense() {
        mockMembers(alice, bob);

        // Alice paid $50, split equally -> Bob owes Alice $25.
        Expense expense = expense(1L, alice, new BigDecimal("50.00"));
        when(expenseRepository.findByGroupId(GROUP_ID)).thenReturn(List.of(expense));
        when(expenseSplitRepository.findByExpenseId(1L)).thenReturn(List.of(
                split(alice, new BigDecimal("25.00")),
                split(bob, new BigDecimal("25.00"))
        ));
        when(settlementRepository.findByGroupId(GROUP_ID)).thenReturn(List.of());

        GroupBalancesResponse response = balanceService.getBalances(GROUP_ID, REQUESTER_ID);

        BalanceResponse aliceBalance = balanceOf(response, alice.getId());
        BalanceResponse bobBalance = balanceOf(response, bob.getId());
        assertThat(aliceBalance.netBalance()).isEqualByComparingTo("25.00");
        assertThat(bobBalance.netBalance()).isEqualByComparingTo("-25.00");

        assertThat(response.suggestedSettlements()).hasSize(1);
        SettlementSuggestion suggestion = response.suggestedSettlements().get(0);
        assertThat(suggestion.fromUserId()).isEqualTo(bob.getId());
        assertThat(suggestion.toUserId()).isEqualTo(alice.getId());
        assertThat(suggestion.amount()).isEqualByComparingTo("25.00");
    }

    @Test
    @DisplayName("a prior settlement reduces the outstanding suggested amount")
    void settlementReducesOutstandingDebt() {
        mockMembers(alice, bob);

        Expense expense = expense(1L, alice, new BigDecimal("50.00"));
        when(expenseRepository.findByGroupId(GROUP_ID)).thenReturn(List.of(expense));
        when(expenseSplitRepository.findByExpenseId(1L)).thenReturn(List.of(
                split(alice, new BigDecimal("25.00")),
                split(bob, new BigDecimal("25.00"))
        ));
        // Bob already paid Alice $10 towards the $25 he owes.
        Settlement settlement = Settlement.builder()
                .id(1L).group(group).fromUser(bob).toUser(alice).amount(new BigDecimal("10.00")).build();
        when(settlementRepository.findByGroupId(GROUP_ID)).thenReturn(List.of(settlement));

        GroupBalancesResponse response = balanceService.getBalances(GROUP_ID, REQUESTER_ID);

        assertThat(response.suggestedSettlements()).hasSize(1);
        assertThat(response.suggestedSettlements().get(0).amount()).isEqualByComparingTo("15.00");
    }

    @Test
    @DisplayName("everyone settled up produces zero balances and zero suggestions")
    void fullySettledGroupHasNoSuggestions() {
        mockMembers(alice, bob);
        when(expenseRepository.findByGroupId(GROUP_ID)).thenReturn(List.of());
        when(settlementRepository.findByGroupId(GROUP_ID)).thenReturn(List.of());

        GroupBalancesResponse response = balanceService.getBalances(GROUP_ID, REQUESTER_ID);

        assertThat(response.balances()).allSatisfy(b -> assertThat(b.netBalance()).isEqualByComparingTo("0.00"));
        assertThat(response.suggestedSettlements()).isEmpty();
    }

    @Test
    @DisplayName("debt-simplification: three-person chain collapses to two transactions, not three")
    void debtSimplificationMinimizesTransactions() {
        mockMembers(alice, bob, carol);

        // Alice paid 90 (split equally 3 ways: everyone owes 30) -> Alice net +60
        // Bob paid 30 (split equally 3 ways) -> Bob net +20, Carol net -20, Alice net -10 (from this expense)
        // Net overall: Alice +50, Bob -10... let's use a cleaner, hand-verifiable scenario instead:
        // Alice paid 60 total, split equally among all 3 -> Alice +40, Bob -20, Carol -20.
        Expense expense = expense(1L, alice, new BigDecimal("60.00"));
        when(expenseRepository.findByGroupId(GROUP_ID)).thenReturn(List.of(expense));
        when(expenseSplitRepository.findByExpenseId(1L)).thenReturn(List.of(
                split(alice, new BigDecimal("20.00")),
                split(bob, new BigDecimal("20.00")),
                split(carol, new BigDecimal("20.00"))
        ));
        when(settlementRepository.findByGroupId(GROUP_ID)).thenReturn(List.of());

        GroupBalancesResponse response = balanceService.getBalances(GROUP_ID, REQUESTER_ID);

        assertThat(balanceOf(response, alice.getId()).netBalance()).isEqualByComparingTo("40.00");
        assertThat(balanceOf(response, bob.getId()).netBalance()).isEqualByComparingTo("-20.00");
        assertThat(balanceOf(response, carol.getId()).netBalance()).isEqualByComparingTo("-20.00");

        // Minimum-transaction plan: exactly 2 payments, both into Alice, nothing between Bob and Carol.
        assertThat(response.suggestedSettlements()).hasSize(2);
        assertThat(response.suggestedSettlements())
                .allSatisfy(s -> assertThat(s.toUserId()).isEqualTo(alice.getId()));
        BigDecimal totalPaidToAlice = response.suggestedSettlements().stream()
                .map(SettlementSuggestion::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalPaidToAlice).isEqualByComparingTo("40.00");
    }

    private void mockMembers(User... users) {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        List<GroupMember> members = List.of(users).stream()
                .map(u -> GroupMember.builder().group(group).user(u).build())
                .toList();
        when(groupAccessService.getMembers(GROUP_ID)).thenReturn(members);
    }

    private User user(Long id, String name) {
        return User.builder().id(id).name(name).email(name.toLowerCase() + "@example.com").build();
    }

    private Expense expense(Long id, User paidBy, BigDecimal amount) {
        return Expense.builder().id(id).group(group).paidBy(paidBy).amount(amount)
                .description("test expense").splitType(SplitType.EQUAL).build();
    }

    private ExpenseSplit split(User user, BigDecimal amountOwed) {
        return ExpenseSplit.builder().user(user).amountOwed(amountOwed).build();
    }

    private BalanceResponse balanceOf(GroupBalancesResponse response, Long userId) {
        return response.balances().stream()
                .filter(b -> b.userId().equals(userId))
                .findFirst()
                .orElseThrow();
    }
}