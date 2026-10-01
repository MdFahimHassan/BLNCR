package dev.fahim.blncr.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {"spring.jpa.hibernate.ddl-auto=validate", "spring.flyway.enabled=true"})
class PostgresMigrationIntegrityTest {

    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:18.6");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void configurePostgres(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("jwt.secret", () -> "test-only-secret-key-for-postgres-container-tests-123456");
        registry.add("cors.allowed-origins", () -> "http://localhost:5173");
        registry.add("app.email.mx-check", () -> "false");
    }

    @Test
    void flywayAppliesAllMigrationsAndPostgresEnforcesExpenseConstraints() {
        String latestMigration = jdbcTemplate.queryForObject(
                "SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank DESC LIMIT 1",
                String.class);
        assertThat(latestMigration).isEqualTo("7");
        assertNotNullColumn("groups", "created_by");
        assertNotNullColumn("group_members", "group_id");
        assertNotNullColumn("group_members", "user_id");
        assertNotNullColumn("expenses", "group_id");
        assertNotNullColumn("expenses", "paid_by");
        assertNotNullColumn("expense_splits", "expense_id");
        assertNotNullColumn("expense_splits", "user_id");
        assertNotNullColumn("settlements", "group_id");
        assertNotNullColumn("settlements", "from_user");
        assertNotNullColumn("settlements", "to_user");

        Long userId = jdbcTemplate.queryForObject(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id",
                Long.class, "Alice", "alice@container.test", "hash");
        Long groupId = jdbcTemplate.queryForObject(
                "INSERT INTO groups (name, created_by) VALUES (?, ?) RETURNING id",
                Long.class, "Trip", userId);
        UUID key = UUID.randomUUID();
        Long expenseId = jdbcTemplate.queryForObject("""
                INSERT INTO expenses (group_id, paid_by, created_by_user_id, idempotency_key,
                                      amount, description, split_type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """, Long.class, groupId, userId, userId, key, new BigDecimal("12.00"), "Lunch", "EQUAL");

        assertThatThrownBy(() -> jdbcTemplate.update(
                "INSERT INTO expenses (group_id, paid_by, amount) VALUES (?, ?, ?)",
                groupId, userId, BigDecimal.ZERO))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update(
                "INSERT INTO expenses (group_id, paid_by, amount) VALUES (?, ?, ?)",
                groupId, null, new BigDecimal("1.00")))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update("""
                INSERT INTO settlements (group_id, from_user, to_user, amount)
                VALUES (?, ?, ?, ?)
                """, groupId, userId, userId, BigDecimal.ZERO))
                .isInstanceOf(DataIntegrityViolationException.class);

        jdbcTemplate.update("INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES (?, ?, ?)",
                expenseId, userId, new BigDecimal("12.00"));
        assertThatThrownBy(() -> jdbcTemplate.update(
                "INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES (?, ?, ?)",
                expenseId, userId, new BigDecimal("12.00")))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbcTemplate.update("""
                INSERT INTO expenses (group_id, paid_by, created_by_user_id, idempotency_key, amount)
                VALUES (?, ?, ?, ?, ?)
                """, groupId, userId, userId, key, new BigDecimal("12.00")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

        private void assertNotNullColumn(String table, String column) {
                String nullable = jdbcTemplate.queryForObject("""
                                SELECT is_nullable
                                FROM information_schema.columns
                                WHERE table_schema = current_schema() AND table_name = ? AND column_name = ?
                                """, String.class, table, column);
                assertThat(nullable).isEqualTo("NO");
        }
}