package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.ExpenseSplit;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.Settlement;
import dev.fahim.blncr.entity.SplitType;
import dev.fahim.blncr.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class ExpenseRepositoryTest {

    @Autowired
    private ExpenseRepository expenseRepository;
    @Autowired
    private TestEntityManager entityManager;

    private Group group;
    private Group otherGroup;
    private User alice;

    @BeforeEach
    void setUp() {
        alice = entityManager.persist(User.builder().name("Alice").email("alice@example.com")
                .passwordHash("h").createdAt(Instant.now()).build());
        group = entityManager.persist(Group.builder().name("Trip").createdBy(alice).createdAt(Instant.now()).build());
        otherGroup = entityManager.persist(Group.builder().name("Rent").createdBy(alice).createdAt(Instant.now()).build());

        Instant now = Instant.now();
        entityManager.persist(newExpense(group, "Groceries", now.minus(2, ChronoUnit.DAYS)));
        entityManager.persist(newExpense(group, "Dinner", now));
        entityManager.persist(newExpense(otherGroup, "Rent", now));
    }

    @Test
    @DisplayName("findByGroupId only returns expenses for that group")
    void scopedToGroup() {
        List<Expense> expenses = expenseRepository.findByGroupId(group.getId());

        assertThat(expenses).hasSize(2);
        assertThat(expenses).extracting(Expense::getDescription).containsExactlyInAnyOrder("Groceries", "Dinner");
    }

    @Test
    @DisplayName("findByGroupIdOrderByCreatedAtDesc returns newest first")
    void orderedNewestFirst() {
        List<Expense> expenses = expenseRepository.findByGroupIdOrderByCreatedAtDesc(group.getId());

        assertThat(expenses).extracting(expense -> expense.getDescription()).containsExactly("Dinner", "Groceries");
    }

        @Test
        @DisplayName("aggregates a user's group net balances including settlements and empty groups")
        void aggregatesDashboardNetBalances() {
        User bob = entityManager.persist(User.builder().name("Bob").email("bob@example.com")
            .passwordHash("h").createdAt(Instant.now()).build());
        Group summaryGroup = entityManager.persist(Group.builder().name("Summary")
            .createdBy(alice).createdAt(Instant.now()).build());
        Group emptyGroup = entityManager.persist(Group.builder().name("Empty")
            .createdBy(alice).createdAt(Instant.now()).build());
        entityManager.persist(GroupMember.builder().group(summaryGroup).user(alice).joinedAt(Instant.now()).build());
        entityManager.persist(GroupMember.builder().group(summaryGroup).user(bob).joinedAt(Instant.now()).build());
        entityManager.persist(GroupMember.builder().group(emptyGroup).user(alice).joinedAt(Instant.now()).build());

        Expense expense = entityManager.persist(newExpense(summaryGroup, "Dinner", Instant.now()));
        expense.setAmount(new BigDecimal("60.00"));
        entityManager.persist(ExpenseSplit.builder().expense(expense).user(alice)
            .amountOwed(new BigDecimal("20.00")).build());
        entityManager.persist(ExpenseSplit.builder().expense(expense).user(bob)
            .amountOwed(new BigDecimal("20.00")).build());
        entityManager.persist(Settlement.builder().group(summaryGroup).fromUser(bob).toUser(alice)
            .amount(new BigDecimal("10.00")).settledAt(Instant.now()).build());
        entityManager.flush();

        List<GroupNetBalance> balances = expenseRepository.findNetBalancesForUser(alice.getId());

        assertThat(balances).extracting(GroupNetBalance::getGroupId)
            .containsExactlyInAnyOrder(summaryGroup.getId(), emptyGroup.getId());
        BigDecimal summaryBalance = balances.stream()
            .filter(balance -> balance.getGroupId().equals(summaryGroup.getId()))
            .findFirst().orElseThrow().getNetBalance();
        BigDecimal emptyGroupBalance = balances.stream()
            .filter(balance -> balance.getGroupId().equals(emptyGroup.getId()))
            .findFirst().orElseThrow().getNetBalance();
        assertThat(summaryBalance).isEqualByComparingTo("30.00");
        assertThat(emptyGroupBalance).isEqualByComparingTo("0.00");
        }

    private Expense newExpense(Group g, String description, Instant createdAt) {
        return Expense.builder()
                .group(g).paidBy(alice).amount(new BigDecimal("10.00"))
                .description(description).splitType(SplitType.EQUAL).createdAt(createdAt)
                .build();
    }
}