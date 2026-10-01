package dev.fahim.blncr.service;

import dev.fahim.blncr.dto.CreateGroupRequest;
import dev.fahim.blncr.dto.GroupMemberResponse;
import dev.fahim.blncr.dto.GroupResponse;
import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.User;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.repository.GroupMemberRepository;
import dev.fahim.blncr.repository.GroupMemberCount;
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
    @DisplayName("creating a group preserves its selected currency")
    void preservesSelectedCurrency() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));
        when(groupMemberRepository.save(any(GroupMember.class))).thenAnswer(inv -> inv.getArgument(0));

        GroupResponse response = groupService.createGroup(alice.getId(), new CreateGroupRequest("Rangamati", "BDT"));

        assertThat(response.currency()).isEqualTo("BDT");
    }

    @Test
    @DisplayName("an active member can list the group's active members")
    void activeMemberCanListMembers() {
        Group group = Group.builder().id(1L).name("Trip").createdBy(alice).build();
        GroupMember aliceMembership = GroupMember.builder().id(1L).group(group).user(alice).build();

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupIdAndUserIdAndLeftAtIsNull(1L, alice.getId())).thenReturn(true);
        when(groupMemberRepository.findByGroupIdAndLeftAtIsNullOrderByJoinedAtAsc(1L))
                .thenReturn(List.of(aliceMembership));

        List<GroupMemberResponse> members = groupService.listMembers(1L, alice.getId());

        assertThat(members).hasSize(1);
        assertThat(members.get(0).userId()).isEqualTo(alice.getId());
    }

    @Test
    @DisplayName("a member who has left the group can no longer list its members")
    void formerMemberCannotListMembers() {
        Group group = Group.builder().id(1L).name("Trip").createdBy(alice).build();

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.existsByGroupIdAndUserIdAndLeftAtIsNull(1L, bob.getId())).thenReturn(false);

        assertThatThrownBy(() -> groupService.listMembers(1L, bob.getId()))
                .isInstanceOf(NotGroupMemberException.class);
        verify(groupMemberRepository, never()).existsByGroupIdAndUserId(any(), any());
    }

    @Test
    @DisplayName("a member who has left the group can no longer look up another member")
    void formerMemberCannotGetMember() {
        when(groupMemberRepository.existsByGroupIdAndUserIdAndLeftAtIsNull(1L, bob.getId())).thenReturn(false);

        assertThatThrownBy(() -> groupService.getMember(1L, alice.getId(), bob.getId()))
                .isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    @DisplayName("listMyGroups returns each group with its current member count")
    void listsGroupsWithMemberCount() {
        Group group = Group.builder().id(1L).name("Trip").createdBy(alice).build();
        GroupMember membership = GroupMember.builder().id(1L).group(group).user(alice).build();

        when(groupMemberRepository.findByUserIdAndLeftAtIsNull(alice.getId())).thenReturn(List.of(membership));
        when(groupMemberRepository.countMembersByGroupIds(List.of(1L)))
            .thenReturn(List.of(new GroupMemberCount(1L, 2L)));

        List<GroupResponse> groups = groupService.listMyGroups(alice.getId());

        assertThat(groups).hasSize(1);
        assertThat(groups.get(0).memberCount()).isEqualTo(2);
    }
}