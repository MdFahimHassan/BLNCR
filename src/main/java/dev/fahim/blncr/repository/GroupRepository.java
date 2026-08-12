package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupRepository extends JpaRepository<Group, Long> {
}