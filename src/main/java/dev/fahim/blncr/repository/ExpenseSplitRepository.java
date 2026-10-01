package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.ExpenseSplit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, Long> {

    List<ExpenseSplit> findByExpenseId(Long expenseId);

    @EntityGraph(attributePaths = {"expense", "user"})
    List<ExpenseSplit> findByExpenseIdIn(Collection<Long> expenseIds);

    void deleteByExpenseIdIn(Collection<Long> expenseIds);

    void deleteByExpenseId(Long expenseId);

    List<ExpenseSplit> findByUserId(Long userId);
}