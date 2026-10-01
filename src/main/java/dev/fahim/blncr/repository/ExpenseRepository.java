package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.Expense;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @EntityGraph(attributePaths = {"group", "paidBy"})
    List<Expense> findByGroupId(Long groupId);

    @EntityGraph(attributePaths = {"group", "paidBy"})
    List<Expense> findByGroupIdOrderByCreatedAtDesc(Long groupId);

    @EntityGraph(attributePaths = {"group", "paidBy", "createdBy"})
    Optional<Expense> findByIdAndGroupId(Long id, Long groupId);

        @EntityGraph(attributePaths = {"group", "paidBy"})
        Optional<Expense> findByCreatedByIdAndGroupIdAndIdempotencyKey(
            Long createdById, Long groupId, UUID idempotencyKey);

        @Query("select expense.id from Expense expense where expense.group.id = :groupId")
        List<Long> findIdsByGroupId(@Param("groupId") Long groupId);

        void deleteByGroupId(Long groupId);

    @Query(value = """
            WITH user_groups AS (
                SELECT group_id FROM group_members WHERE user_id = :userId AND left_at IS NULL
            ), ledger AS (
                SELECT e.group_id, e.paid_by AS user_id, e.amount AS delta
                FROM expenses e JOIN user_groups ug ON ug.group_id = e.group_id
                WHERE e.paid_by = :userId
                UNION ALL
                SELECT e.group_id, es.user_id, -es.amount_owed
                FROM expense_splits es
                JOIN expenses e ON e.id = es.expense_id
                JOIN user_groups ug ON ug.group_id = e.group_id
                WHERE es.user_id = :userId
                UNION ALL
                SELECT s.group_id, s.from_user, s.amount
                FROM settlements s JOIN user_groups ug ON ug.group_id = s.group_id
                WHERE s.from_user = :userId
                UNION ALL
                SELECT s.group_id, s.to_user, -s.amount
                FROM settlements s JOIN user_groups ug ON ug.group_id = s.group_id
                WHERE s.to_user = :userId
            )
            SELECT ug.group_id AS "groupId", COALESCE(SUM(ledger.delta), 0) AS "netBalance"
            FROM user_groups ug
            LEFT JOIN ledger ON ledger.group_id = ug.group_id AND ledger.user_id = :userId
            GROUP BY ug.group_id
            """, nativeQuery = true)
    List<GroupNetBalance> findNetBalancesForUser(@Param("userId") Long userId);
}