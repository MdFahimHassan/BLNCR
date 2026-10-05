package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.User;
import lombok.Builder;

import java.time.Instant;

@Builder
public record UserResponse(
        Long id,
        String name,
        String email,
        Instant createdAt,
        String avatar
) {
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .avatar(user.getProfileImageVersion() == null ? null
                    : "/api/users/me/avatar?v=" + user.getProfileImageVersion())
                .build();
    }
}