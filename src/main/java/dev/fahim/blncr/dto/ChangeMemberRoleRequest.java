package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.GroupRole;
import jakarta.validation.constraints.NotNull;

public record ChangeMemberRoleRequest(@NotNull GroupRole role) {
}