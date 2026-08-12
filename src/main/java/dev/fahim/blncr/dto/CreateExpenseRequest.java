package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.SplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreateExpenseRequest(

        @NotBlank(message = "Description is required")
        String description,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,

        @NotNull(message = "paidByUserId is required")
        Long paidByUserId,

        @NotNull(message = "splitType is required")
        SplitType splitType,

        @NotEmpty(message = "At least one split participant is required")
        List<@Valid ExpenseSplitInput> splits
) {}