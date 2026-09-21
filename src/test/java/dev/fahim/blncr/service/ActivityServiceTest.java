package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.ActivityItem;
import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.Settlement;
import dev.fahim.blncr.entity.SplitType;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.SettlementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private GroupAccessService groupAccessService;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private SettlementRepository settlementRepository;

    @InjectMocks
    private ActivityService activityService;

    private static final Long GROUP_ID = 1L;
    private static final Long REQUESTER_ID = 100L;

    private Group group;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(100L).name("Alice").build();
        bob = User.builder().id(200L).name("Bob").build();
        group = Group.builder().id(GROUP_ID).name("Trip").build();
        when(groupAccessService.getGroupOrThrow(GROUP_ID)).thenReturn(group);
    }

    @Test
    @DisplayName("merges expenses and settlements into one feed sorted newest first")
    void mergesAndSortsChronologically() {
        LocalDateTime now = LocalDateTime.now();

        Expense oldExpense = Expense.builder().id(1L).paidBy(alice).amount(new BigDecimal("30.00"))
                .description("Groceries").splitType(SplitType.EQUAL).createdAt(now.minusDays(2)).build();
        Expense newExpense = Expense.builder().id(2L).paidBy(bob).amount(new BigDecimal("10.00"))
                .description("Coffee").splitType(SplitType.EQUAL).createdAt(now).build();
        Settlement middleSettlement = Settlement.builder().id(1L).fromUser(bob).toUser(alice)
                .amount(new BigDecimal("15.00")).settledAt(now.minusDays(1)).build();

        when(expenseRepository.findByGroupId(GROUP_ID)).thenReturn(List.of(oldExpense, newExpense));
        when(settlementRepository.findByGroupId(GROUP_ID)).thenReturn(List.of(middleSettlement));

        List<ActivityItem> activity = activityService.getActivity(GROUP_ID, REQUESTER_ID);

        assertThat(activity).hasSize(3);
        assertThat(activity.get(0).id()).isEqualTo(2L);   // newest: the coffee expense
        assertThat(activity.get(0).type()).isEqualTo("EXPENSE");
        assertThat(activity.get(1).id()).isEqualTo(1L);   // the settlement, in the middle
        assertThat(activity.get(1).type()).isEqualTo("SETTLEMENT");
        assertThat(activity.get(2).id()).isEqualTo(1L);   // oldest: the groceries expense
        assertThat(activity.get(2).type()).isEqualTo("EXPENSE");
    }

    @Test
    @DisplayName("an empty group has an empty activity feed")
    void emptyGroupHasEmptyFeed() {
        when(expenseRepository.findByGroupId(GROUP_ID)).thenReturn(List.of());
        when(settlementRepository.findByGroupId(GROUP_ID)).thenReturn(List.of());

        assertThat(activityService.getActivity(GROUP_ID, REQUESTER_ID)).isEmpty();
    }

    @Test
    @DisplayName("throws when the requester is not a member of the group")
    void throwsWhenRequesterNotMember() {
        doThrow(new NotGroupMemberException("nope"))
                .when(groupAccessService).requireMembership(GROUP_ID, REQUESTER_ID);

        assertThatThrownBy(() -> activityService.getActivity(GROUP_ID, REQUESTER_ID))
                .isInstanceOf(NotGroupMemberException.class);
    }
}