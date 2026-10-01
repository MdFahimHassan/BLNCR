package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.GroupInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupInvitationRepository extends JpaRepository<GroupInvitation, Long> {
    Optional<GroupInvitation> findByTokenHash(String tokenHash);

    void deleteByGroupId(Long groupId);

    void deleteByCreatedById(Long userId);
}