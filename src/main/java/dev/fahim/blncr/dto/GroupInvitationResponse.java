package dev.fahim.blncr.dto;

import java.time.Instant;

public record GroupInvitationResponse(Long groupId, String groupName, String token, Instant expiresAt) {
}