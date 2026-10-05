package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.GroupMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<GroupMember> findByGroupId(Long groupId);

    @EntityGraph(attributePaths = {"user"})
    List<GroupMember> findByGroupIdAndLeftAtIsNullOrderByJoinedAtAsc(Long groupId);

    @EntityGraph(attributePaths = {"group", "group.createdBy"})
    List<GroupMember> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"group", "group.createdBy"})
    List<GroupMember> findByUserIdAndLeftAtIsNull(Long userId);

    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    Optional<GroupMember> findByGroupIdAndUserIdAndLeftAtIsNull(Long groupId, Long userId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserIdAndLeftAtIsNull(Long groupId, Long userId);

    List<GroupMember> findByUserIdOrderByJoinedAtAsc(Long userId);

    void deleteByGroupId(Long groupId);

    @Query("""
            select new dev.fahim.blncr.repository.GroupMemberCount(member.group.id, count(member.id))
            from GroupMember member
            where member.group.id in :groupIds and member.leftAt is null
            group by member.group.id
            """)
    List<GroupMemberCount> countMembersByGroupIds(@Param("groupIds") Collection<Long> groupIds);
}