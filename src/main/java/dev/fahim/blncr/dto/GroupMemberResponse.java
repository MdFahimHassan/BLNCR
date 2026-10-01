package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.GroupMember;
import lombok.Builder;

import java.time.Instant;

@Builder
public record GroupMemberResponse(
        Long userId,
        String name,
        String email,
        Instant joinedAt
) {
    public static GroupMemberResponse from(GroupMember member) {
        return GroupMemberResponse.builder()
                .userId(member.getUser().getId())
                .name(member.getUser().getName())
                .email(member.getUser().getEmail())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}