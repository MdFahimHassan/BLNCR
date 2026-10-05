-- Baseline schema for BLNCR, mirroring exactly what Hibernate's ddl-auto=update
-- had been generating from the JPA entities in dev.fahim.blncr.entity.
-- From Phase 6 onward, schema changes go through new versioned Flyway migrations
-- (V2__..., V3__..., etc.) instead of relying on Hibernate to auto-alter tables.

CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    created_at     TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE groups (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    created_by  BIGINT,
    created_at  TIMESTAMP,
    CONSTRAINT fk_groups_created_by FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE group_members (
    id         BIGSERIAL PRIMARY KEY,
    group_id   BIGINT,
    user_id    BIGINT,
    joined_at  TIMESTAMP,
    CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES groups (id),
    CONSTRAINT fk_group_members_user  FOREIGN KEY (user_id)  REFERENCES users (id)
);

-- Not part of the original Hibernate-generated schema (Hibernate had no unique
-- constraint here), but a group/user pair should never repeat, and the app-level
-- idempotency check in GroupService deserves a DB-level backstop.
CREATE UNIQUE INDEX uk_group_members_group_user ON group_members (group_id, user_id);

CREATE TABLE expenses (
    id          BIGSERIAL PRIMARY KEY,
    group_id    BIGINT,
    paid_by     BIGINT,
    amount      NUMERIC(19, 2) NOT NULL,
    description VARCHAR(255),
    split_type  VARCHAR(20),
    created_at  TIMESTAMP,
    CONSTRAINT fk_expenses_group   FOREIGN KEY (group_id) REFERENCES groups (id),
    CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by)  REFERENCES users (id)
);

CREATE TABLE expense_splits (
    id           BIGSERIAL PRIMARY KEY,
    expense_id   BIGINT,
    user_id      BIGINT,
    amount_owed  NUMERIC(19, 2) NOT NULL,
    CONSTRAINT fk_expense_splits_expense FOREIGN KEY (expense_id) REFERENCES expenses (id),
    CONSTRAINT fk_expense_splits_user    FOREIGN KEY (user_id)    REFERENCES users (id)
);

CREATE TABLE settlements (
    id          BIGSERIAL PRIMARY KEY,
    group_id    BIGINT,
    from_user   BIGINT,
    to_user     BIGINT,
    amount      NUMERIC(19, 2) NOT NULL,
    settled_at  TIMESTAMP,
    CONSTRAINT fk_settlements_group     FOREIGN KEY (group_id)  REFERENCES groups (id),
    CONSTRAINT fk_settlements_from_user FOREIGN KEY (from_user) REFERENCES users (id),
    CONSTRAINT fk_settlements_to_user   FOREIGN KEY (to_user)   REFERENCES users (id)
);

-- Lookup indexes for the query patterns the repositories actually use
-- (findByGroupId, findByUserId, findByExpenseId, etc.) — Hibernate's
-- auto-ddl never added these, but they matter once data volume grows.
CREATE INDEX idx_group_members_group_id ON group_members (group_id);
CREATE INDEX idx_group_members_user_id  ON group_members (user_id);
CREATE INDEX idx_expenses_group_id      ON expenses (group_id);
CREATE INDEX idx_expense_splits_expense_id ON expense_splits (expense_id);
CREATE INDEX idx_expense_splits_user_id    ON expense_splits (user_id);
CREATE INDEX idx_settlements_group_id      ON settlements (group_id);