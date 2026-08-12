package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.CreateGroupRequest;
import dev.fahim.blncr.dto.GroupMemberResponse;
import dev.fahim.blncr.dto.GroupResponse;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.GroupMemberRepository;
import dev.fahim.blncr.repository.GroupRepository;
import dev.fahim.blncr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

        Group group = Group.builder()
                .name(request.name().trim())
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .build();
        Group saved = groupRepository.save(group);

        // The creator is automatically the first member of their own group.
        GroupMember membership = GroupMember.builder()
                .group(saved)
                .user(creator)
                .joinedAt(LocalDateTime.now())
                .build();
        groupMemberRepository.save(membership);

        return GroupResponse.from(saved, 1);
    }

    @Transactional
    public GroupMemberResponse addMember(Long groupId, Long requesterId, String memberEmail) {
        Group group = getGroupOrThrow(groupId);
        requireMembership(groupId, requesterId);

        User newMember = userRepository.findByEmail(memberEmail.trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("No user found with email: " + memberEmail));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, newMember.getId())) {
            GroupMember existing = groupMemberRepository.findByGroupIdAndUserId(groupId, newMember.getId()).get();
            return GroupMemberResponse.from(existing);
        }

        GroupMember membership = GroupMember.builder()
                .group(group)
                .user(newMember)
                .joinedAt(LocalDateTime.now())
                .build();
        GroupMember saved = groupMemberRepository.save(membership);

        return GroupMemberResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> listMyGroups(Long userId) {
        return groupMemberRepository.findByUserId(userId).stream()
                .map(GroupMember::getGroup)
                .map(group -> GroupResponse.from(group, groupMemberRepository.findByGroupId(group.getId()).size()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> listMembers(Long groupId, Long requesterId) {
        getGroupOrThrow(groupId);
        requireMembership(groupId, requesterId);

        return groupMemberRepository.findByGroupId(groupId).stream()
                .map(GroupMemberResponse::from)
                .toList();
    }

    private Group getGroupOrThrow(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));
    }

    private void requireMembership(Long groupId, Long userId) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new NotGroupMemberException("You must be a member of this group to perform this action");
        }
    }
}