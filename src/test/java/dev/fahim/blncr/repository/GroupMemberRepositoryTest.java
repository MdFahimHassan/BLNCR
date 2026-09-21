package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.GroupMember;
import dev.fahim.blncr.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class GroupMemberRepositoryTest {

    @Autowired
    private GroupMemberRepository groupMemberRepository;
    @Autowired
    private TestEntityManager entityManager;

    private User alice;
    private User bob;
    private Group group;

    @BeforeEach
    void setUp() {
        alice = entityManager.persist(User.builder().name("Alice").email("alice@example.com")
                .passwordHash("h").createdAt(LocalDateTime.now()).build());
        bob = entityManager.persist(User.builder().name("Bob").email("bob@example.com")
                .passwordHash("h").createdAt(LocalDateTime.now()).build());
        group = entityManager.persist(Group.builder().name("Trip").createdBy(alice).createdAt(LocalDateTime.now()).build());
        entityManager.persist(GroupMember.builder().group(group).user(alice).joinedAt(LocalDateTime.now()).build());
    }

    @Test
    @DisplayName("existsByGroupIdAndUserId is true for a member, false for a non-member")
    void checksMembership() {
        assertThat(groupMemberRepository.existsByGroupIdAndUserId(group.getId(), alice.getId())).isTrue();
        assertThat(groupMemberRepository.existsByGroupIdAndUserId(group.getId(), bob.getId())).isFalse();
    }

    @Test
    @DisplayName("findByGroupId returns every member row for that group")
    void findsAllMembersOfGroup() {
        entityManager.persist(GroupMember.builder().group(group).user(bob).joinedAt(LocalDateTime.now()).build());

        assertThat(groupMemberRepository.findByGroupId(group.getId())).hasSize(2);
    }

    @Test
    @DisplayName("findByUserId returns every group a user belongs to")
    void findsAllGroupsOfUser() {
        assertThat(groupMemberRepository.findByUserId(alice.getId())).hasSize(1);
        assertThat(groupMemberRepository.findByUserId(bob.getId())).isEmpty();
    }

    @Test
    @DisplayName("findByGroupIdAndUserId returns the specific membership row")
    void findsSpecificMembership() {
        assertThat(groupMemberRepository.findByGroupIdAndUserId(group.getId(), alice.getId())).isPresent();
        assertThat(groupMemberRepository.findByGroupIdAndUserId(group.getId(), bob.getId())).isEmpty();
    }
}