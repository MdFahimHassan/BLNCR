package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.AcceptedInvitationResponse;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupInvitation;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.GroupRole;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.InvalidRequestException;
import dev.fahim.blncr.repository.ExpenseRepository;
import dev.fahim.blncr.repository.ExpenseSplitRepository;
import dev.fahim.blncr.repository.GroupInvitationRepository;
import dev.fahim.blncr.repository.GroupMemberRepository;
import dev.fahim.blncr.repository.GroupNetBalance;
import dev.fahim.blncr.repository.GroupRepository;
import dev.fahim.blncr.repository.SettlementRepository;
import dev.fahim.blncr.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupManagementServiceTest {

    private static final Long GROUP_ID = 1L;
    private static final Long OWNER_ID = 10L;
    private static final Long BOB_ID = 20L;

    @Mock
    private GroupAccessService groupAccessService;
    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMemberRepository groupMemberRepository;
    @Mock
    private GroupInvitationRepository invitationRepository;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private ExpenseSplitRepository expenseSplitRepository;
    @Mock
    private SettlementRepository settlementRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GroupManagementService service;

    private User owner;
    private User bob;
    private Group group;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(OWNER_ID).name("Owner").email("owner@example.com").build();
        bob = User.builder().id(BOB_ID).name("Bob").email("bob@example.com").build();
        group = Group.builder().id(GROUP_ID).name("Trip").createdBy(owner).build();
    }

    private static GroupNetBalance net(long groupId, String amount) {
        return new GroupNetBalance() {
            @Override
            public Long getGroupId() {
                return groupId;
            }

            @Override
            public BigDecimal getNetBalance() {
                return new BigDecimal(amount);
            }
        };
    }

    private GroupMember member(User user, GroupRole role) {
        return GroupMember.builder().group(group).user(user).role(role).joinedAt(Instant.now()).build();
    }

    // ---- leaving ----

    @Test
    @DisplayName("leaving is blocked while you owe money")
    void leaveBlockedWhenInDebt() {
        GroupMember membership = member(bob, GroupRole.MEMBER);
        when(groupAccessService.requireActiveMember(GROUP_ID, BOB_ID)).thenReturn(membership);
        when(expenseRepository.findNetBalancesForUser(BOB_ID)).thenReturn(List.of(net(GROUP_ID, "-12.50")));

        assertThatThrownBy(() -> service.leaveGroup(GROUP_ID, BOB_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Settle your balance");
        assertThat(membership.getLeftAt()).isNull();
        verify(groupMemberRepository, never()).save(any(GroupMember.class));
    }

    @Test
    @DisplayName("leaving is blocked while you are owed money")
    void leaveBlockedWhenOwed() {
        GroupMember membership = member(bob, GroupRole.MEMBER);
        when(groupAccessService.requireActiveMember(GROUP_ID, BOB_ID)).thenReturn(membership);
        when(expenseRepository.findNetBalancesForUser(BOB_ID)).thenReturn(List.of(net(GROUP_ID, "30.00")));

        assertThatThrownBy(() -> service.leaveGroup(GROUP_ID, BOB_ID))
                .isInstanceOf(InvalidRequestException.class);
        assertThat(membership.getLeftAt()).isNull();
    }

    @Test
    @DisplayName("leaving works once the balance is exactly zero")
    void leaveAllowedWhenSettled() {
        GroupMember membership = member(bob, GroupRole.MEMBER);
        when(groupAccessService.requireActiveMember(GROUP_ID, BOB_ID)).thenReturn(membership);
        when(expenseRepository.findNetBalancesForUser(BOB_ID)).thenReturn(List.of(net(GROUP_ID, "0.00")));

        service.leaveGroup(GROUP_ID, BOB_ID);

        assertThat(membership.getLeftAt()).isNotNull();
        verify(groupMemberRepository).save(membership);
    }

    @Test
    @DisplayName("a balance in a different group does not block leaving this one")
    void leaveIgnoresOtherGroupsBalances() {
        GroupMember membership = member(bob, GroupRole.MEMBER);
        when(groupAccessService.requireActiveMember(GROUP_ID, BOB_ID)).thenReturn(membership);
        when(expenseRepository.findNetBalancesForUser(BOB_ID)).thenReturn(List.of(net(99L, "-50.00")));

        service.leaveGroup(GROUP_ID, BOB_ID);

        assertThat(membership.getLeftAt()).isNotNull();
    }

    @Test
    @DisplayName("the owner still cannot leave without transferring ownership")
    void ownerCannotLeave() {
        when(groupAccessService.requireActiveMember(GROUP_ID, OWNER_ID))
                .thenReturn(member(owner, GroupRole.OWNER));

        assertThatThrownBy(() -> service.leaveGroup(GROUP_ID, OWNER_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Transfer ownership");
    }

    // ---- removing ----

    @Test
    @DisplayName("removing a member is blocked while they have an unsettled balance")
    void removeBlockedWhenTargetUnsettled() {
        GroupMember target = member(bob, GroupRole.MEMBER);
        when(groupAccessService.requireActiveMember(GROUP_ID, OWNER_ID))
                .thenReturn(member(owner, GroupRole.OWNER));
        when(groupMemberRepository.findByGroupIdAndUserIdAndLeftAtIsNull(GROUP_ID, BOB_ID))
                .thenReturn(Optional.of(target));
        when(expenseRepository.findNetBalancesForUser(BOB_ID)).thenReturn(List.of(net(GROUP_ID, "-5.00")));

        assertThatThrownBy(() -> service.removeMember(GROUP_ID, OWNER_ID, BOB_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("unsettled balance");
        assertThat(target.getLeftAt()).isNull();
        verify(groupMemberRepository, never()).save(any(GroupMember.class));
    }

    @Test
    @DisplayName("a settled-up member can be removed")
    void removeAllowedWhenTargetSettled() {
        GroupMember target = member(bob, GroupRole.MEMBER);
        when(groupAccessService.requireActiveMember(GROUP_ID, OWNER_ID))
                .thenReturn(member(owner, GroupRole.OWNER));
        when(groupMemberRepository.findByGroupIdAndUserIdAndLeftAtIsNull(GROUP_ID, BOB_ID))
                .thenReturn(Optional.of(target));
        when(expenseRepository.findNetBalancesForUser(BOB_ID)).thenReturn(List.of());

        service.removeMember(GROUP_ID, OWNER_ID, BOB_ID);

        assertThat(target.getLeftAt()).isNotNull();
        verify(groupMemberRepository).save(target);
    }

    // ---- account deletion ----

    @Test
    @DisplayName("deleting an account is blocked while a group balance is unsettled")
    void accountDeletionBlockedWhenUnsettled() {
        GroupMember membership = member(bob, GroupRole.MEMBER);
        when(groupMemberRepository.findByUserIdOrderByJoinedAtAsc(BOB_ID)).thenReturn(List.of(membership));
        when(expenseRepository.findNetBalancesForUser(BOB_ID)).thenReturn(List.of(net(GROUP_ID, "-8.00")));

        assertThatThrownBy(() -> service.prepareAccountDeletion(BOB_ID))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Trip");
        assertThat(membership.getLeftAt()).isNull();
        verify(invitationRepository, never()).deleteByCreatedById(any());
    }

    @Test
    @DisplayName("deleting an account works when every balance is settled")
    void accountDeletionAllowedWhenSettled() {
        GroupMember membership = member(bob, GroupRole.MEMBER);
        when(groupMemberRepository.findByUserIdOrderByJoinedAtAsc(BOB_ID)).thenReturn(List.of(membership));
        when(expenseRepository.findNetBalancesForUser(BOB_ID)).thenReturn(List.of(net(GROUP_ID, "0.00")));

        service.prepareAccountDeletion(BOB_ID);

        assertThat(membership.getLeftAt()).isNotNull();
        verify(invitationRepository).deleteByCreatedById(BOB_ID);
    }

    // ---- invitations ----

    @Test
    @DisplayName("accepting an invitation reads it with a row lock so a single-use link can't be used twice at once")
    void acceptLocksTheInvitationRow() {
        GroupInvitation invitation = GroupInvitation.builder()
                .group(group)
                .createdBy(owner)
                .tokenHash("hash")
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(1, ChronoUnit.DAYS))
                .build();
        when(invitationRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(invitation));
        when(userRepository.findById(BOB_ID)).thenReturn(Optional.of(bob));
        when(groupMemberRepository.findByGroupIdAndUserId(GROUP_ID, BOB_ID)).thenReturn(Optional.empty());

        AcceptedInvitationResponse response = service.acceptInvitation("some-token", BOB_ID);

        assertThat(response.groupId()).isEqualTo(GROUP_ID);
        assertThat(invitation.getAcceptedAt()).isNotNull();
        assertThat(invitation.getAcceptedBy()).isEqualTo(bob);
        verify(groupMemberRepository).save(any(GroupMember.class));
        verify(invitationRepository, never()).findByTokenHash(anyString());
    }

    @Test
    @DisplayName("an invitation already accepted by someone else is rejected")
    void acceptRejectsAlreadyUsedInvitation() {
        User someoneElse = User.builder().id(77L).name("Zed").email("zed@example.com").build();
        GroupInvitation used = GroupInvitation.builder()
                .group(group)
                .createdBy(owner)
                .tokenHash("hash")
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(1, ChronoUnit.DAYS))
                .acceptedAt(Instant.now())
                .acceptedBy(someoneElse)
                .build();
        when(invitationRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(used));
        when(userRepository.findById(BOB_ID)).thenReturn(Optional.of(bob));

        assertThatThrownBy(() -> service.acceptInvitation("some-token", BOB_ID))
                .isInstanceOf(dev.fahim.blncr.exception.ResourceNotFoundException.class);
        verify(groupMemberRepository, never()).save(any(GroupMember.class));
    }
}