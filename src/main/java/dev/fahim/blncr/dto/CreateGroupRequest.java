package dev.fahim.blncr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateGroupRequest(

        @NotBlank(message = "Group name is required")
        @Size(max = 100, message = "Group name must be at most 100 characters")
        @Pattern(regexp = "^[^\\p{Cntrl}]*$", message = "Group name contains invalid characters")
        String name,

        // Optional: ISO 4217 code like "BDT". Missing/blank defaults to USD.
        @Size(max = 3, message = "Currency must be a 3-letter code")
        String currency
) {
    /** Keeps existing callers (and tests) that only pass a name working. */
    public CreateGroupRequest(String name) {
        this(name, null);
    }
}