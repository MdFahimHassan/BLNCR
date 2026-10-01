package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.AcceptedInvitationResponse;
import dev.fahim.blncr.dto.GroupInvitationResponse;
import dev.fahim.blncr.entity.Expense;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupInvitation;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.GroupRole;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.ForbiddenActionException;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.ExpenseSplitRepository;
import dev.fahim.blncr.repository.GroupInvitationRepository;
import dev.fahim.blncr.repository.GroupMemberRepository;
import dev.fahim.blncr.repository.GroupRepository;
import dev.fahim.blncr.repository.SettlementRepository;
import dev.fahim.blncr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Comparator;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupManagementService {

    private final GroupAccessService groupAccessService;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupInvitationRepository invitationRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupInvitationResponse createInvitation(Long groupId, Long requesterId) {
        Group group = groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireManager(groupId, requesterId);
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant expiresAt = now.plus(7, ChronoUnit.DAYS);
        invitationRepository.save(GroupInvitation.builder()
                .group(group)
                .createdBy(requester)
                .tokenHash(hashToken(token))
                .createdAt(now)
                .expiresAt(expiresAt)
                .build());
        return new GroupInvitationResponse(groupId, group.getName(), token, expiresAt);
    }

    @Transactional
    public AcceptedInvitationResponse acceptInvitation(String token, Long userId) {
        GroupInvitation invitation = invitationRepository.findByTokenHashForUpdate(hashToken(token))
                .orElseThrow(this::invalidInvitation);
        Instant now = Instant.now();
        if (invitation.getExpiresAt().isBefore(now)) {
            throw invalidInvitation();
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (invitation.getAcceptedAt() != null) {
            if (invitation.getAcceptedBy() == null || !invitation.getAcceptedBy().getId().equals(userId)) {
                throw invalidInvitation();
            }
            return acceptedResponse(invitation);
        }

        Long groupId = invitation.getGroup().getId();
        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, userId).orElse(null);
        if (membership == null) {
            groupMemberRepository.save(GroupMember.builder()
                    .group(invitation.getGroup())
                    .user(user)
                    .role(GroupRole.MEMBER)
                    .joinedAt(now)
                    .build());
        } else if (membership.getLeftAt() != null) {
            membership.setLeftAt(null);
            membership.setRole(GroupRole.MEMBER);
            membership.setJoinedAt(now);
            groupMemberRepository.save(membership);
        }

        invitation.setAcceptedAt(now);
        invitation.setAcceptedBy(user);
        invitationRepository.save(invitation);
        return acceptedResponse(invitation);
    }

    @Transactional
    public GroupRole changeRole(Long groupId, Long requesterId, Long targetUserId, GroupRole newRole) {
        groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireOwner(groupId, requesterId);
        GroupMember target = activeMember(groupId, targetUserId);
        if (target.getRole() == GroupRole.OWNER) {
            if (newRole != GroupRole.OWNER) {
                throw new InvalidRequestException("Transfer ownership before changing the owner's role");
            }
            return GroupRole.OWNER;
        }

        if (newRole == GroupRole.OWNER) {
            GroupMember currentOwner = groupAccessService.requireActiveMember(groupId, requesterId);
            currentOwner.setRole(GroupRole.ADMIN);
            target.setRole(GroupRole.OWNER);
            Group group = groupAccessService.getGroupOrThrow(groupId);
            group.setCreatedBy(target.getUser());
            groupRepository.save(group);
            groupMemberRepository.saveAll(List.of(currentOwner, target));
            return GroupRole.OWNER;
        }

        target.setRole(newRole);
        groupMemberRepository.save(target);
        return newRole;
    }

    @Transactional
    public void removeMember(Long groupId, Long requesterId, Long targetUserId) {
        groupAccessService.getGroupOrThrow(groupId);
        GroupMember requester = groupAccessService.requireActiveMember(groupId, requesterId);
        GroupMember target = activeMember(groupId, targetUserId);
        requireManagerRole(requester.getRole());
        if (requesterId.equals(targetUserId)) {
            throw new InvalidRequestException("Use the leave-group action to remove yourself");
        }
        if (target.getRole() == GroupRole.OWNER) {
            throw new ForbiddenActionException("The owner must transfer ownership before being removed");
        }
        if (requester.getRole() == GroupRole.ADMIN && target.getRole() != GroupRole.MEMBER) {
            throw new ForbiddenActionException("Admins can only remove regular members");
        }
        requireSettledUp(groupId, targetUserId,
                "This member still has an unsettled balance. Settle up before removing them.");
        target.setLeftAt(Instant.now());
        groupMemberRepository.save(target);
    }

    @Transactional
    public void leaveGroup(Long groupId, Long userId) {
        groupAccessService.getGroupOrThrow(groupId);
        GroupMember membership = groupAccessService.requireActiveMember(groupId, userId);
        if (membership.getRole() == GroupRole.OWNER) {
            throw new InvalidRequestException("Transfer ownership or delete the group before leaving");
        }
        requireSettledUp(groupId, userId, "Settle your balance before leaving this group");
        membership.setLeftAt(Instant.now());
        groupMemberRepository.save(membership);
    }

    @Transactional
    public void deleteGroup(Long groupId, Long requesterId) {
        groupAccessService.getGroupOrThrow(groupId);
        groupAccessService.requireOwner(groupId, requesterId);
        deleteGroupData(groupId);
    }

    @Transactional
    public void deleteGroupData(Long groupId) {
        List<Long> expenseIds = expenseRepository.findIdsByGroupId(groupId);
        if (!expenseIds.isEmpty()) {
            expenseSplitRepository.deleteByExpenseIdIn(expenseIds);
        }
        expenseRepository.deleteByGroupId(groupId);
        settlementRepository.deleteByGroupId(groupId);
        invitationRepository.deleteByGroupId(groupId);
        groupMemberRepository.deleteByGroupId(groupId);
        groupRepository.deleteById(groupId);
    }

    @Transactional
    public void prepareAccountDeletion(Long userId) {
        Instant now = Instant.now();
        for (GroupMember membership : groupMemberRepository.findByUserIdOrderByJoinedAtAsc(userId)) {
            if (membership.getLeftAt() != null) {
                continue;
            }
            Long membershipGroupId = membership.getGroup().getId();
            String settleMessage = "Settle your balance in \"" + membership.getGroup().getName()
                    + "\" before deleting your account";
            if (membership.getRole() != GroupRole.OWNER) {
                requireSettledUp(membershipGroupId, userId, settleMessage);
                membership.setLeftAt(now);
                groupMemberRepository.save(membership);
                continue;
            }

            Long groupId = membership.getGroup().getId();
            List<GroupMember> successors = groupMemberRepository
                    .findByGroupIdAndLeftAtIsNullOrderByJoinedAtAsc(groupId).stream()
                    .filter(member -> !member.getUser().getId().equals(userId))
                    .sorted(Comparator.comparing((GroupMember member) -> member.getRole() != GroupRole.ADMIN)
                            .thenComparing(GroupMember::getJoinedAt))
                    .toList();
            if (successors.isEmpty()) {
                deleteGroupData(groupId);
                continue;
            }

            requireSettledUp(groupId, userId, settleMessage);
            GroupMember successor = successors.get(0);
            successor.setRole(GroupRole.OWNER);
            membership.setRole(GroupRole.ADMIN);
            membership.setLeftAt(now);
            membership.getGroup().setCreatedBy(successor.getUser());
            groupRepository.save(membership.getGroup());
            groupMemberRepository.saveAll(List.of(membership, successor));
        }
        invitationRepository.deleteByCreatedById(userId);
    }

    private GroupMember activeMember(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserIdAndLeftAtIsNull(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group member not found"));
    }

    /**
     * Someone with a non-zero balance must not leave: settlements can only be recorded between
     * active members, so their debt (or what they're owed) could never be cleared afterwards.
     * Amounts are exact cents (NUMERIC(19,2)), so an exact zero check is correct here.
     */
    private void requireSettledUp(Long groupId, Long userId, String message) {
        boolean unsettled = expenseRepository.findNetBalancesForUser(userId).stream()
                .anyMatch(balance -> groupId.equals(balance.getGroupId())
                        && balance.getNetBalance() != null
                        && balance.getNetBalance().signum() != 0);
        if (unsettled) {
            throw new InvalidRequestException(message);
        }
    }

    private void requireManagerRole(GroupRole role) {
        if (role != GroupRole.OWNER && role != GroupRole.ADMIN) {
            throw new ForbiddenActionException("Only group owners and admins can perform this action");
        }
    }

    private AcceptedInvitationResponse acceptedResponse(GroupInvitation invitation) {
        return new AcceptedInvitationResponse(invitation.getGroup().getId(), invitation.getGroup().getName());
    }

    private ResourceNotFoundException invalidInvitation() {
        return new ResourceNotFoundException("Invitation is invalid or expired");
    }

    private String hashToken(String token) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}