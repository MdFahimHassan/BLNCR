package dev.fahim.blncr.dto;

import lombok.Builder;

@Builder
public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String name,
        String email
) {
    public static AuthResponse of(String token, Long userId, String name, String email) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(userId)
                .name(name)
                .email(email)
                .build();
    }
}
