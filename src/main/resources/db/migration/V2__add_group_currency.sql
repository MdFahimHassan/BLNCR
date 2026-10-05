-- Each group now tracks its expenses in one currency (ISO 4217 code).
-- Existing groups were all implicitly USD, so default them to that.
ALTER TABLE groups ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';