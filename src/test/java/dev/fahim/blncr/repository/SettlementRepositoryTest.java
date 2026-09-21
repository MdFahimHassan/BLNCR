package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.Group;
import dev.fahim.blncr.entity.Settlement;
import dev.fahim.blncr.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class SettlementRepositoryTest {

    @Autowired
    private SettlementRepository settlementRepository;
    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("findByGroupId only returns settlements belonging to that group")
    void scopedToGroup() {
        User alice = entityManager.persist(User.builder().name("Alice").email("alice@example.com")
                .passwordHash("h").createdAt(LocalDateTime.now()).build());
        User bob = entityManager.persist(User.builder().name("Bob").email("bob@example.com")
                .passwordHash("h").createdAt(LocalDateTime.now()).build());
        Group tripGroup = entityManager.persist(Group.builder().name("Trip").createdBy(alice).createdAt(LocalDateTime.now()).build());
        Group rentGroup = entityManager.persist(Group.builder().name("Rent").createdBy(alice).createdAt(LocalDateTime.now()).build());

        entityManager.persist(Settlement.builder().group(tripGroup).fromUser(bob).toUser(alice)
                .amount(new BigDecimal("20.00")).settledAt(LocalDateTime.now()).build());
        entityManager.persist(Settlement.builder().group(rentGroup).fromUser(alice).toUser(bob)
                .amount(new BigDecimal("50.00")).settledAt(LocalDateTime.now()).build());

        assertThat(settlementRepository.findByGroupId(tripGroup.getId())).hasSize(1);
        assertThat(settlementRepository.findByGroupId(tripGroup.getId()).get(0).getAmount())
                .isEqualByComparingTo("20.00");
    }
}