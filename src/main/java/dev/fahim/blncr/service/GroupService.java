package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.CreateGroupRequest;
import dev.fahim.blncr.dto.GroupMemberResponse;
import dev.fahim.blncr.dto.GroupResponse;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.GroupRole;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.GroupMemberRepository;
import dev.fahim.blncr.repository.GroupMemberCount;
import dev.fahim.blncr.repository.GroupRepository;
import dev.fahim.blncr.repository.UserRepository;
import dev.fahim.blncr.validation.SupportedCurrencies;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupResponse createGroup(Long creatorId, CreateGroupRequest request) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String currency = SupportedCurrencies.normalize(request.currency());
        if (!SupportedCurrencies.isSupported(currency)) {
            throw new InvalidRequestException("Unsupported currency: " + request.currency());
        }

        Group group = Group.builder()
                .name(request.name().trim())
                .createdBy(creator)
                .createdAt(Instant.now())
                .currency(currency)
                .build();
        Group saved = groupRepository.save(group);

        GroupMember membership = GroupMember.builder()
                .group(saved)
                .user(creator)
            .role(GroupRole.OWNER)
                .joinedAt(Instant.now())
                .build();
        groupMemberRepository.save(membership);

        return GroupResponse.from(saved, 1);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> listMyGroups(Long userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserIdAndLeftAtIsNull(userId);
        if (memberships.isEmpty()) {
            return List.of();
        }

        List<Long> groupIds = memberships.stream().map(member -> member.getGroup().getId()).toList();
        Map<Long, Long> memberCounts = groupMemberRepository.countMembersByGroupIds(groupIds).stream()
            .collect(Collectors.toMap(GroupMemberCount::groupId, GroupMemberCount::memberCount));

        return memberships.stream()
            .map(member -> GroupResponse.from(member.getGroup(),
                Math.toIntExact(memberCounts.getOrDefault(member.getGroup().getId(), 0L)),
                member.getRole()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> listMembers(Long groupId, Long requesterId) {
        getGroupOrThrow(groupId);
        requireMembership(groupId, requesterId);

        return groupMemberRepository.findByGroupIdAndLeftAtIsNullOrderByJoinedAtAsc(groupId).stream()
                .map(GroupMemberResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupMemberResponse getMember(Long groupId, Long userId, Long requesterId) {
        requireMembership(groupId, requesterId);
        return groupMemberRepository.findByGroupIdAndUserIdAndLeftAtIsNull(groupId, userId)
                .map(GroupMemberResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Group member not found"));
    }

    private Group getGroupOrThrow(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));
    }

    private void requireMembership(Long groupId, Long userId) {
        if (!groupMemberRepository.existsByGroupIdAndUserIdAndLeftAtIsNull(groupId, userId)) {
            throw new NotGroupMemberException("You must be a member of this group to perform this action");
        }
    }
}