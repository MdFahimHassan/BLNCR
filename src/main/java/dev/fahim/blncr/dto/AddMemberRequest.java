package dev.fahim.blncr.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AddMemberRequest(

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email
) {}