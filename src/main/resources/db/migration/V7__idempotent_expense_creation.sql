ALTER TABLE expenses ADD COLUMN created_by_user_id BIGINT;
ALTER TABLE expenses ADD COLUMN idempotency_key UUID;
ALTER TABLE expenses
    ADD CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id);

CREATE UNIQUE INDEX uk_expenses_idempotency
    ON expenses (created_by_user_id, group_id, idempotency_key);