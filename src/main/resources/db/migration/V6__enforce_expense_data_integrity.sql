ALTER TABLE groups ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE group_members ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE group_members ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE expenses ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN paid_by SET NOT NULL;
ALTER TABLE expenses
    ADD CONSTRAINT ck_expenses_amount_positive CHECK (amount > 0);

ALTER TABLE expense_splits ALTER COLUMN expense_id SET NOT NULL;
ALTER TABLE expense_splits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE expense_splits
    ADD CONSTRAINT ck_expense_splits_amount_nonnegative CHECK (amount_owed >= 0);
ALTER TABLE expense_splits
    ADD CONSTRAINT uk_expense_splits_expense_user UNIQUE (expense_id, user_id);

ALTER TABLE settlements ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE settlements ALTER COLUMN from_user SET NOT NULL;
ALTER TABLE settlements ALTER COLUMN to_user SET NOT NULL;
ALTER TABLE settlements
    ADD CONSTRAINT ck_settlements_amount_positive CHECK (amount > 0);