package dev.fahim.blncr.dto;

import dev.fahim.blncr.entity.User;
import lombok.Builder;

import java.util.Base64;
import java.time.LocalDateTime;

@Builder
public record UserResponse(
        Long id,
        String name,
        String email,
        LocalDateTime createdAt,
        String avatar
) {
    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .avatar(user.getProfileImage() == null ? null : "data:"
                    + user.getProfileImageContentType() + ";base64," + Base64.getEncoder().encodeToString(user.getProfileImage()))
                .build();
    }
}
