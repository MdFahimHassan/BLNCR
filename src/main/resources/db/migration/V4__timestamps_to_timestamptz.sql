-- Timestamps were TIMESTAMP (no time zone) holding LocalDateTime.now() from the server's clock,
-- so the JSON sent to browsers had no zone and each browser guessed it was local time.
-- They are now TIMESTAMPTZ and the entities use java.time.Instant (serialized as ISO-8601 with "Z").
--
-- Existing rows: the old values were written by the backend JVM, which runs in UTC on Railway/Docker,
-- so they are reinterpreted as UTC. If you ever ran the API in another zone against a database you
-- want to keep, change 'UTC' below to that zone (e.g. 'Asia/Dhaka') BEFORE applying this migration.

ALTER TABLE users         ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE groups        ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE group_members ALTER COLUMN joined_at  TYPE TIMESTAMPTZ USING joined_at  AT TIME ZONE 'UTC';
ALTER TABLE expenses      ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
ALTER TABLE settlements   ALTER COLUMN settled_at TYPE TIMESTAMPTZ USING settled_at AT TIME ZONE 'UTC';