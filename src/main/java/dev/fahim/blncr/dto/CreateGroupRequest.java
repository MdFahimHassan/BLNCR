package dev.fahim.blncr.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateGroupRequest(

        @NotBlank(message = "Group name is required")
        String name
) {}