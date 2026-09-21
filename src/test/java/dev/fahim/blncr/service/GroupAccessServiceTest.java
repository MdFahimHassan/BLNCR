package dev.fahim.blncr.service;

import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.exception.NotGroupMemberException;
import dev.fahim.blncr.exception.ResourceNotFoundException;
import dev.fahim.blncr.repository.GroupMemberRepository;
import dev.fahim.blncr.repository.GroupRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupAccessServiceTest {

    @Mock
    private GroupRepository groupRepository;
    @Mock
    private GroupMemberRepository groupMemberRepository;

    @InjectMocks
    private GroupAccessService groupAccessService;

    @Test
    @DisplayName("getGroupOrThrow returns the group when it exists")
    void returnsExistingGroup() {
        Group group = Group.builder().id(1L).name("Trip").build();
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        assertThat(groupAccessService.getGroupOrThrow(1L)).isEqualTo(group);
    }

    @Test
    @DisplayName("getGroupOrThrow throws ResourceNotFoundException for a missing group")
    void throwsForMissingGroup() {
        when(groupRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> groupAccessService.getGroupOrThrow(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("requireMembership passes silently for an actual member")
    void requireMembershipPassesForMember() {
        when(groupMemberRepository.existsByGroupIdAndUserId(1L, 100L)).thenReturn(true);

        groupAccessService.requireMembership(1L, 100L);
        // no exception -> pass
    }

    @Test
    @DisplayName("requireMembership throws NotGroupMemberException for a non-member")
    void requireMembershipThrowsForNonMember() {
        when(groupMemberRepository.existsByGroupIdAndUserId(1L, 100L)).thenReturn(false);

        assertThatThrownBy(() -> groupAccessService.requireMembership(1L, 100L))
                .isInstanceOf(NotGroupMemberException.class);
    }

    @Test
    @DisplayName("getMembers delegates straight to the repository")
    void getMembersDelegatesToRepository() {
        List<GroupMember> members = List.of(GroupMember.builder().id(1L).build());
        when(groupMemberRepository.findByGroupId(1L)).thenReturn(members);

        assertThat(groupAccessService.getMembers(1L)).isEqualTo(members);
    }
}