package dev.fahim.blncr.controller;

import dev.fahim.blncr.dto.AcceptedInvitationResponse;
import dev.fahim.blncr.security.UserPrincipal;
import dev.fahim.blncr.service.GroupManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final GroupManagementService groupManagementService;

    @PostMapping("/{token}/accept")
    public AcceptedInvitationResponse accept(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String token
    ) {
        return groupManagementService.acceptInvitation(token, principal.getId());
    }
}