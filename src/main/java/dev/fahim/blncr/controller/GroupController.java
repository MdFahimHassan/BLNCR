package dev.fahim.blncr.controller;

import dev.fahim.blncr.dto.AddMemberRequest;
import dev.fahim.blncr.dto.CreateGroupRequest;
import dev.fahim.blncr.dto.GroupMemberResponse;
import dev.fahim.blncr.dto.GroupResponse;
import dev.fahim.blncr.security.UserPrincipal;
import dev.fahim.blncr.service.GroupService;
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

    @PostMapping("/{groupId}/members")
    public ResponseEntity<GroupMemberResponse> addMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long groupId,
            @Valid @RequestBody AddMemberRequest request
    ) {
        GroupMemberResponse response = groupService.addMember(groupId, principal.getId(), request.email());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}