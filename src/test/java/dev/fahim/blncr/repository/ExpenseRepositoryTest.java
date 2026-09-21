package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.Group;
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
import java.time.LocalDateTime;
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
                .passwordHash("h").createdAt(LocalDateTime.now()).build());
        group = entityManager.persist(Group.builder().name("Trip").createdBy(alice).createdAt(LocalDateTime.now()).build());
        otherGroup = entityManager.persist(Group.builder().name("Rent").createdBy(alice).createdAt(LocalDateTime.now()).build());

        LocalDateTime now = LocalDateTime.now();
        entityManager.persist(newExpense(group, "Groceries", now.minusDays(2)));
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

    private Expense newExpense(Group g, String description, LocalDateTime createdAt) {
        return Expense.builder()
                .group(g).paidBy(alice).amount(new BigDecimal("10.00"))
                .description(description).splitType(SplitType.EQUAL).createdAt(createdAt)
                .build();
    }
}