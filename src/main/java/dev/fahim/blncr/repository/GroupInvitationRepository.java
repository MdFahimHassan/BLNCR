package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.GroupInvitation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Long> {
    Optional<GroupInvitation> findByTokenHash(String tokenHash);

    /** Row-locked load (SELECT ... FOR UPDATE) so concurrent accepts of a single-use link are serialized. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from GroupInvitation i where i.tokenHash = :tokenHash")
    Optional<GroupInvitation> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    void deleteByGroupId(Long groupId);

    void deleteByCreatedById(Long userId);
}