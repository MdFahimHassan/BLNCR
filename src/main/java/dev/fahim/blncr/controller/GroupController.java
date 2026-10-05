package dev.fahim.blncr.controller;

import dev.fahim.blncr.dto.ChangeMemberRoleRequest;
import dev.fahim.blncr.dto.CreateGroupRequest;
import dev.fahim.blncr.dto.GroupInvitationResponse;
import dev.fahim.blncr.dto.GroupMemberResponse;
import dev.fahim.blncr.dto.GroupResponse;
import dev.fahim.blncr.security.UserPrincipal;
import dev.fahim.blncr.service.GroupService;
import dev.fahim.blncr.service.GroupManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final GroupManagementService groupManagementService;

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGroupRequest request
    ) {
        GroupResponse response = groupService.createGroup(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<GroupResponse> listMyGroups(@AuthenticationPrincipal UserPrincipal principal) {
        return groupService.listMyGroups(principal.getId());
    }

    @GetMapping("/{groupId}/members")
    public List<GroupMemberResponse> listMembers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId
    ) {
        return groupService.listMembers(groupId, principal.getId());
    }

    @PostMapping("/{groupId}/invitations")
    public ResponseEntity<GroupInvitationResponse> createInvitation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId
    ) {
        GroupInvitationResponse response = groupManagementService.createInvitation(groupId, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{groupId}/members/{userId}/role")
    public GroupMemberResponse changeRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId,
            @PathVariable Long userId,
            @Valid @RequestBody ChangeMemberRoleRequest request
    ) {
        groupManagementService.changeRole(groupId, principal.getId(), userId, request.role());
        return groupService.getMember(groupId, userId, principal.getId());
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId,
            @PathVariable Long userId
    ) {
        groupManagementService.removeMember(groupId, principal.getId(), userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId
    ) {
        groupManagementService.leaveGroup(groupId, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId
    ) {
        groupManagementService.deleteGroup(groupId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}