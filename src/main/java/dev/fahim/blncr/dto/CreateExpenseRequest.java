package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.SplitType;
import dev.fahim.blncr.entity.ExpenseCategory;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreateExpenseRequest(

        @NotBlank(message = "Description is required")
        @Size(max = 200, message = "Description must be at most 200 characters")
        @Pattern(regexp = "^[^\\p{Cntrl}]*$", message = "Description contains invalid characters")
        String description,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        @DecimalMax(value = "1000000000.00", message = "Amount is too large")
        @Digits(integer = 10, fraction = 2, message = "Amount can have at most 2 decimal places")
        BigDecimal amount,

        @NotNull(message = "paidByUserId is required")
        Long paidByUserId,

        @NotNull(message = "splitType is required")
        SplitType splitType,

        @NotEmpty(message = "At least one split participant is required")
        @Size(max = 100, message = "A split can include at most 100 participants")
                List<@Valid ExpenseSplitInput> splits,

                @NotNull(message = "Category is required")
                ExpenseCategory category
) {
        public CreateExpenseRequest(
                        String description,
                        BigDecimal amount,
                        Long paidByUserId,
                        SplitType splitType,
                        List<ExpenseSplitInput> splits
        ) {
                this(description, amount, paidByUserId, splitType, splits, ExpenseCategory.OTHER);
        }

        public CreateExpenseRequest {
                if (category == null) {
                        category = ExpenseCategory.OTHER;
                }
        }
}
