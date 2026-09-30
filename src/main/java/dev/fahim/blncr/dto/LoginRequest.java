package dev.fahim.blncr.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

        // Deliberately the lenient @Email (not @ValidEmail): login must keep working for any
        // account that already exists, and it must not trigger DNS lookups on every attempt.
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 254, message = "Email must be at most 254 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(max = 128, message = "Password is too long")
        String password
) {}
