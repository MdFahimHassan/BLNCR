package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByGroupId(Long groupId);

    List<Expense> findByGroupIdOrderByCreatedAtDesc(Long groupId);
}