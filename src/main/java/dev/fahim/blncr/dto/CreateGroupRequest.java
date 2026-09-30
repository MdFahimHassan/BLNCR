package dev.fahim.blncr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateGroupRequest(

        @NotBlank(message = "Group name is required")
        @Size(max = 100, message = "Group name must be at most 100 characters")
        @Pattern(regexp = "^[^\\p{Cntrl}]*$", message = "Group name contains invalid characters")
        String name
) {}
