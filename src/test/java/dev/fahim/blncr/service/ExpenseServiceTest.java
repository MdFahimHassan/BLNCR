package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.CreateExpenseRequest;
import dev.fahim.blncr.dto.ExpenseResponse;
import dev.fahim.blncr.dto.ExpenseSplitInput;
import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.ExpenseSplit;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.SplitType;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.ExpenseSplitRepository;
import dev.fahim.blncr.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private ExpenseSplitRepository expenseSplitRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GroupAccessService groupAccessService;

    // Real instance on purpose: SplitCalculator is pure, deterministic logic already covered
    // by its own unit tests, so wiring it in for real here checks the two layers integrate
    // correctly rather than re-mocking math that's simple to just run.
    private final SplitCalculator splitCalculator = new SplitCalculator();

    private ExpenseService expenseService;

    private static final Long GROUP_ID = 1L;
    private static final Long REQUESTER_ID = 100L;

    private Group group;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        expenseService = new ExpenseService(
                expenseRepository, expenseSplitRepository, userRepository, groupAccessService, splitCalculator);

        alice = User.builder().id(100L).name("Alice").email("alice@example.com").build();
        bob = User.builder().id(200L).name("Bob").email("bob@example.com").build();
        group = Group.builder().id(GROUP_ID).name("Trip").createdBy(alice).build();
    }

    @Test
    @DisplayName("adds an EQUAL-split expense and persists a split row per participant")
    void addsEqualSplitExpense() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(groupAccessService.isMember(GROUP_ID, alice.getId())).thenReturn(true);
        when(groupAccessService.getMembers(GROUP_ID)).thenReturn(List.of(
                GroupMember.builder().group(group).user(alice).build(),
                GroupMember.builder().group(group).user(bob).build()
        ));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> {
            Expense e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });
        when(expenseSplitRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        CreateExpenseRequest request = new CreateExpenseRequest(
                "Dinner", new BigDecimal("40.00"), alice.getId(), SplitType.EQUAL,
                List.of(new ExpenseSplitInput(alice.getId(), null), new ExpenseSplitInput(bob.getId(), null)));

        ExpenseResponse response = expenseService.addExpense(GROUP_ID, REQUESTER_ID, request);

        assertThat(response.amount()).isEqualByComparingTo("40.00");
        assertThat(response.splits()).hasSize(2);
        assertThat(response.splits()).allSatisfy(s -> assertThat(s.amountOwed()).isEqualByComparingTo("20.00"));

        ArgumentCaptor<List<ExpenseSplit>> captor = ArgumentCaptor.forClass(List.class);
        verify(expenseSplitRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
    }

    @Test
    @DisplayName("rejects an expense when the payer is not a group member")
    void rejectsNonMemberPayer() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(groupAccessService.isMember(GROUP_ID, bob.getId())).thenReturn(false);

        CreateExpenseRequest request = new CreateExpenseRequest(
                "Dinner", new BigDecimal("40.00"), bob.getId(), SplitType.EQUAL,
                List.of(new ExpenseSplitInput(bob.getId(), null)));

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, REQUESTER_ID, request))
                .isInstanceOf(NotGroupMemberException.class)
                .hasMessageContaining("payer");
    }

    @Test
    @DisplayName("rejects an expense when the requester is not a group member")
    void rejectsNonMemberRequester() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        doThrow(new NotGroupMemberException("not a member"))
                .when(groupAccessService).requireMembership(GROUP_ID, REQUESTER_ID);

        CreateExpenseRequest request = new CreateExpenseRequest(
                "Dinner", new BigDecimal("40.00"), alice.getId(), SplitType.EQUAL,
                List.of(new ExpenseSplitInput(alice.getId(), null)));

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, REQUESTER_ID, request))
                .isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    @DisplayName("rejects an expense when the payer user id doesn't exist")
    void rejectsUnknownPayer() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        CreateExpenseRequest request = new CreateExpenseRequest(
                "Dinner", new BigDecimal("40.00"), 999L, SplitType.EQUAL,
                List.of(new ExpenseSplitInput(999L, null)));

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, REQUESTER_ID, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("rejects a split naming a user who isn't a member of the group")
    void rejectsSplitParticipantNotInGroup() {
        User outsider = User.builder().id(300L).name("Dave").email("dave@example.com").build();

        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(groupAccessService.isMember(GROUP_ID, alice.getId())).thenReturn(true);
        when(groupAccessService.getMembers(GROUP_ID)).thenReturn(List.of(
                GroupMember.builder().group(group).user(alice).build()
        ));

        CreateExpenseRequest request = new CreateExpenseRequest(
                "Dinner", new BigDecimal("40.00"), alice.getId(), SplitType.EQUAL,
                List.of(new ExpenseSplitInput(alice.getId(), null), new ExpenseSplitInput(outsider.getId(), null)));

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, REQUESTER_ID, request))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("not a member");
    }

    @Test
    @DisplayName("EXACT split rejects amounts that don't sum to the expense total")
    void rejectsExactSplitThatDoesNotSumToTotal() {
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(groupAccessService.isMember(GROUP_ID, alice.getId())).thenReturn(true);

        CreateExpenseRequest request = new CreateExpenseRequest(
                "Dinner", new BigDecimal("40.00"), alice.getId(), SplitType.EXACT,
                List.of(new ExpenseSplitInput(alice.getId(), new BigDecimal("10.00")),
                        new ExpenseSplitInput(bob.getId(), new BigDecimal("10.00"))));

        assertThatThrownBy(() -> expenseService.addExpense(GROUP_ID, REQUESTER_ID, request))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("must add up to the expense total");
    }
}