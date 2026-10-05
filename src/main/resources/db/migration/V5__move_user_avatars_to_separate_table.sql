CREATE TABLE user_avatars (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    image BYTEA NOT NULL,
    content_type VARCHAR(32) NOT NULL,
    version BIGINT NOT NULL
);

ALTER TABLE users ADD COLUMN profile_image_version BIGINT;

INSERT INTO user_avatars (user_id, image, content_type, version)
SELECT id, profile_image, profile_image_content_type, 1
FROM users
WHERE profile_image IS NOT NULL;

UPDATE users
SET profile_image_version = 1
WHERE profile_image IS NOT NULL;

ALTER TABLE users DROP COLUMN profile_image;
ALTER TABLE users DROP COLUMN profile_image_content_type;