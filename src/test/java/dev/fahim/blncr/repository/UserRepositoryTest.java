package dev.fahim.blncr.repository;

import dev.fahim.blncr.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

// @DataJpaTest auto-detects H2 on the classpath and swaps in an embedded database instead of
// the real Postgres datasource configured in application.properties.
@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("saves a user and finds them back by id")
    void savesAndFindsById() {
        User user = userRepository.save(newUser("Alice", "alice@example.com"));

        assertThat(userRepository.findById(user.getId())).isPresent();
        assertThat(userRepository.findById(user.getId()).get().getName()).isEqualTo("Alice");
    }

    @Test
    @DisplayName("findByEmail returns the matching user")
    void findsByEmail() {
        userRepository.save(newUser("Alice", "alice@example.com"));

        assertThat(userRepository.findByEmail("alice@example.com")).isPresent();
        assertThat(userRepository.findByEmail("nope@example.com")).isEmpty();
    }

    @Test
    @DisplayName("existsByEmail is true only for a registered email")
    void checksEmailExistence() {
        userRepository.save(newUser("Alice", "alice@example.com"));

        assertThat(userRepository.existsByEmail("alice@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("ghost@example.com")).isFalse();
    }

    @Test
    @DisplayName("email uniqueness is enforced at the database level")
    void enforcesUniqueEmail() {
        userRepository.save(newUser("Alice", "alice@example.com"));
        userRepository.flush();

        org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.dao.DataIntegrityViolationException.class,
                () -> {
                    userRepository.save(newUser("Alice Two", "alice@example.com"));
                    userRepository.flush();
                });
    }

    private User newUser(String name, String email) {
        return User.builder()
                .name(name)
                .email(email)
                .passwordHash("hashed")
                .createdAt(LocalDateTime.now())
                .build();
    }
}