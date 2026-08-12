package dev.fahim.blncr.service;

import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.GroupMemberRepository;
import dev.fahim.blncr.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Small shared helper for the group-scoped services (expenses, balances, settlements, activity)
 * so each of them doesn't have to re-implement "does this group exist" / "is this user in it".
 */
@Service
@RequiredArgsConstructor
public class GroupAccessService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    public Group getGroupOrThrow(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + groupId));
    }

    public void requireMembership(Long groupId, Long userId) {
        if (!isMember(groupId, userId)) {
            throw new NotGroupMemberException("You must be a member of this group to perform this action");
        }
    }

    public boolean isMember(Long groupId, Long userId) {
        return groupMemberRepository.existsByGroupIdAndUserId(groupId, userId);
    }

    public List<GroupMember> getMembers(Long groupId) {
        return groupMemberRepository.findByGroupId(groupId);
    }
}