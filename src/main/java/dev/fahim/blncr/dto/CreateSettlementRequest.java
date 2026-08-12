package dev.fahim.blncr.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateSettlementRequest(

        @NotNull(message = "fromUserId is required")
        Long fromUserId,

        @NotNull(message = "toUserId is required")
        Long toUserId,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount
) {}