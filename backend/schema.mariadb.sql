DROP VIEW IF EXISTS exercise_view;
DROP TABLE IF EXISTS exercise_variant;
DROP TABLE IF EXISTS exercise;

-- == Exercise ====
-- =============================================================================
CREATE TABLE exercise (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8;

CREATE TABLE exercise_variant (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    content VARCHAR(32) NOT NULL,
    exercise_id SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8;

CREATE VIEW exercise_view AS
    SELECT
        e.id,
        e.`name`,
        ev.id AS variantId,
        ev.content AS variantContent
    FROM exercise e
    LEFT JOIN exercise_variant ev ON (ev.exercise_id = e.id);
