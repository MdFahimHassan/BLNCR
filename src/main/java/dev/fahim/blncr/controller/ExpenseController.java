package dev.fahim.blncr.controller;

import dev.fahim.blncr.dto.CreateExpenseRequest;
import dev.fahim.blncr.dto.ExpenseResponse;
import dev.fahim.blncr.security.UserPrincipal;
import dev.fahim.blncr.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups/{groupId}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ExpenseResponse> addExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId,
            @RequestHeader("Idempotency-Key") UUID idempotencyKey,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        ExpenseResponse response = expenseService.addExpense(groupId, principal.getId(), request, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{expenseId}")
    public ExpenseResponse updateExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId,
            @PathVariable Long expenseId,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        return expenseService.updateExpense(groupId, principal.getId(), expenseId, request);
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId,
            @PathVariable Long expenseId
    ) {
        expenseService.deleteExpense(groupId, principal.getId(), expenseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<ExpenseResponse> listExpenses(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId
    ) {
        return expenseService.listExpenses(groupId, principal.getId());
    }
}