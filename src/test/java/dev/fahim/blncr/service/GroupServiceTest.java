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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMemberRepository groupMemberRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GroupService groupService;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = User.builder().id(100L).name("Alice").email("alice@example.com").build();
        bob = User.builder().id(200L).name("Bob").email("bob@example.com").build();
    }

    @Test
    @DisplayName("creating a group automatically adds the creator as the first member")
    void creatorIsAutoAddedAsMember() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(groupRepository.save(any(Group.class))).thenAnswer(inv -> {
            Group g = inv.getArgument(0);
            g.setId(1L);
            return g;
        });
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));

        GroupResponse response = groupService.createGroup(alice.getId(), new CreateGroupRequest("Trip"));

        assertThat(response.name()).isEqualTo("Trip");
        assertThat(response.memberCount()).isEqualTo(1);
        verify(groupMemberRepository).save(any(GroupMember.class));
    }

    @Test
    @DisplayName("adding a member by email works when that email exists")
    void addsExistingUserByEmail() {
        Group group = Group.builder().id(1L).name("Trip").createdBy(alice).build();

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupIdAndUserId(1L, alice.getId())).thenReturn(true);
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(bob));
        when(groupMemberRepository.existsByGroupIdAndUserId(1L, bob.getId())).thenReturn(false);
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));

        GroupMemberResponse response = groupService.addMember(1L, alice.getId(), "bob@example.com");

        assertThat(response.email()).isEqualTo("bob@example.com");
        verify(groupMemberRepository, times(1)).save(any(GroupMember.class));
    }

    @Test
    @DisplayName("adding a member who is already in the group is idempotent (no duplicate row)")
    void addingExistingMemberIsIdempotent() {
        Group group = Group.builder().id(1L).name("Trip").createdBy(alice).build();
        GroupMember existingMembership = GroupMember.builder().id(5L).group(group).user(bob).build();

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupIdAndUserId(1L, alice.getId())).thenReturn(true);
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(bob));
        when(groupMemberRepository.existsByGroupIdAndUserId(1L, bob.getId())).thenReturn(true);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, bob.getId())).thenReturn(Optional.of(existingMembership));

        GroupMemberResponse response = groupService.addMember(1L, alice.getId(), "bob@example.com");

        assertThat(response.userId()).isEqualTo(bob.getId());
        verify(groupMemberRepository, never()).save(any(GroupMember.class));
    }

    @Test
    @DisplayName("rejects adding a member when the requester isn't in the group")
    void rejectsAddMemberByNonMemberRequester() {
        Group group = Group.builder().id(1L).name("Trip").createdBy(alice).build();

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupIdAndUserId(1L, bob.getId())).thenReturn(false);

        assertThatThrownBy(() -> groupService.addMember(1L, bob.getId(), "someone@example.com"))
                .isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    @DisplayName("rejects adding a member whose email doesn't correspond to any account")
    void rejectsUnknownEmail() {
        Group group = Group.builder().id(1L).name("Trip").createdBy(alice).build();

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupIdAndUserId(1L, alice.getId())).thenReturn(true);
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupService.addMember(1L, alice.getId(), "ghost@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("listMyGroups returns each group with its current member count")
    void listsGroupsWithMemberCount() {
        Group group = Group.builder().id(1L).name("Trip").createdBy(alice).build();
        GroupMember membership = GroupMember.builder().id(1L).group(group).user(alice).build();

        when(groupMemberRepository.findByUserId(alice.getId())).thenReturn(List.of(membership));
        when(groupMemberRepository.findByGroupId(1L)).thenReturn(List.of(membership,
                GroupMember.builder().id(2L).group(group).user(bob).build()));

        List<GroupResponse> groups = groupService.listMyGroups(alice.getId());

        assertThat(groups).hasSize(1);
        assertThat(groups.get(0).memberCount()).isEqualTo(2);
    }
}