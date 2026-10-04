package dev.fahim.blncr.service;

import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.GroupRole;
import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.exception.ForbiddenActionException;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.GroupMemberRepository;
import dev.fahim.blncr.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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
        return groupMemberRepository.existsByGroupIdAndUserIdAndLeftAtIsNull(groupId, userId);
    }

    public GroupMember requireActiveMember(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserIdAndLeftAtIsNull(groupId, userId)
                .orElseThrow(() -> new NotGroupMemberException(
                        "You must be an active member of this group to perform this action"));
    }

    public void requireManager(Long groupId, Long userId) {
        GroupRole role = requireActiveMember(groupId, userId).getRole();
        if (role != GroupRole.OWNER && role != GroupRole.ADMIN) {
            throw new ForbiddenActionException("Only group owners and admins can perform this action");
        }
    }

    public void requireOwner(Long groupId, Long userId) {
        if (requireActiveMember(groupId, userId).getRole() != GroupRole.OWNER) {
            throw new ForbiddenActionException("Only the group owner can perform this action");
        }
    }

    public void requireExpenseManager(Long groupId, Long requesterId, Expense expense) {
        GroupRole role = requireActiveMember(groupId, requesterId).getRole();
        if (role == GroupRole.OWNER || role == GroupRole.ADMIN) {
            return;
        }
        Long creatorId = expense.getCreatedBy() == null
                ? expense.getPaidBy().getId()
                : expense.getCreatedBy().getId();
        if (!creatorId.equals(requesterId)) {
            throw new ForbiddenActionException("Only the expense creator or a group admin can change this expense");
        }
    }

    public List<GroupMember> getMembers(Long groupId) {
        return groupMemberRepository.findByGroupId(groupId);
    }

    public List<GroupMember> getActiveMembers(Long groupId) {
        return groupMemberRepository.findByGroupIdAndLeftAtIsNullOrderByJoinedAtAsc(groupId);
    }
}