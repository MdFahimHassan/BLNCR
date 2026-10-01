ALTER TABLE group_members ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'MEMBER';
ALTER TABLE group_members ADD COLUMN left_at TIMESTAMPTZ;

UPDATE group_members member
SET role = 'OWNER'
FROM groups app_group
WHERE member.group_id = app_group.id
  AND member.user_id = app_group.created_by;

ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE expenses ADD COLUMN category VARCHAR(24) NOT NULL DEFAULT 'OTHER';