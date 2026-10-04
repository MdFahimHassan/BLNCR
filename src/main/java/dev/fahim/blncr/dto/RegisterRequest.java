package dev.fahim.blncr.dto;

import dev.fahim.blncr.validation.ValidEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters")
        @Pattern(regexp = "^[^<>\\p{Cntrl}]*$", message = "Name contains invalid characters")
        String name,

        @NotBlank(message = "Email is required")
        @ValidEmail(message = "Enter a valid email address")
        String email,

        // BCrypt ignores bytes past 72; AuthService enforces the limit in bytes.
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        String password
) {}
