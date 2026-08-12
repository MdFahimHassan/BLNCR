package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.Group;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record GroupResponse(
        Long id,
        String name,
        Long createdByUserId,
        String createdByName,
        LocalDateTime createdAt,
        int memberCount
) {
    public static GroupResponse from(Group group, int memberCount) {
        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .createdByUserId(group.getCreatedBy().getId())
                .createdByName(group.getCreatedBy().getName())
                .createdAt(group.getCreatedAt())
                .memberCount(memberCount)
                .build();
    }
}