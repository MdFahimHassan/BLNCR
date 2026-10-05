package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupRole;
import lombok.Builder;

import java.time.Instant;

@Builder
public record GroupResponse(
        Long id,
        String name,
        Long createdByUserId,
        String createdByName,
        Instant createdAt,
        int memberCount,
        String currency,
        GroupRole currentUserRole
) {
    public static GroupResponse from(Group group, int memberCount) {
        return from(group, memberCount, GroupRole.OWNER);
    }

    public static GroupResponse from(Group group, int memberCount, GroupRole currentUserRole) {
        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .createdByUserId(group.getCreatedBy().getId())
                .createdByName(group.getCreatedBy().getName())
                .createdAt(group.getCreatedAt())
                .memberCount(memberCount)
                .currency(group.getCurrency())
                .currentUserRole(currentUserRole)
                .build();
    }
}