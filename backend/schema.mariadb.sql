DROP VIEW IF EXISTS workoutExerciseView;
DROP VIEW IF EXISTS workoutView;
DROP TRIGGER IF EXISTS workoutEndTrg;
DROP TABLE IF EXISTS workoutExerciseSet;
DROP TABLE IF EXISTS workoutExercise;
DROP TABLE IF EXISTS workout;
DROP VIEW IF EXISTS exerciseView;
DROP TABLE IF EXISTS exerciseVariant;
DROP TABLE IF EXISTS exercise;

-- MariaDB int sizes --
-- SMALLINT  -32768      to 32767 signed,      0 to 65535 unsigned
-- MEDIUMINT -8388608    to 8388607 signed,    0 to 16777215 unsigned
-- INT       -2147483648 to 2147483647 signed, 0 to 4294967295 unsigned

-- == Exercise ====
-- =============================================================================
CREATE TABLE exercise (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8;

CREATE TABLE exerciseVariant (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    content VARCHAR(32) NOT NULL,
    exerciseId SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (exerciseId) REFERENCES exercise(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8;

CREATE VIEW exerciseView AS
    SELECT
        e.id,
        e.`name`,
        ev.id AS variantId,
        ev.content AS variantContent
    FROM exercise e
    LEFT JOIN exerciseVariant ev ON (ev.exerciseId = e.id);

-- == Workout ====
-- =============================================================================
CREATE TABLE workout (
    id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `start` INT UNSIGNED NOT NULL,
    `end` INT UNSIGNED DEFAULT NULL,
    notes TEXT,
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8;

CREATE TABLE workoutExercise (
    id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    orderDef TINYINT(1) UNSIGNED NOT NULL,
    workoutId MEDIUMINT UNSIGNED NOT NULL,
    exerciseId SMALLINT UNSIGNED NOT NULL,
    exerciseVariantId SMALLINT UNSIGNED DEFAULT NULL,
    FOREIGN KEY (workoutId) REFERENCES workout(id),
    FOREIGN KEY (exerciseId) REFERENCES exercise(id),
    FOREIGN KEY (exerciseVariantId) REFERENCES exerciseVariant(id),
    PRIMARY KEY (id)
);

CREATE TABLE workoutExerciseSet (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    weight FLOAT NOT NULL,
    reps SMALLINT UNSIGNED NOT NULL,
    workoutExerciseId MEDIUMINT UNSIGNED NOT NULL,
    FOREIGN KEY (workoutExerciseId) REFERENCES workoutExercise(id),
    PRIMARY KEY (id)
);

-- Treenin valmiiksi merkkauksen yhteydessä ajautuva triggeri joka poistaa
-- treenin "tyhjät" liikkeet (jolla ei tehtyjä settejä)
DELIMITER //
CREATE TRIGGER workoutEndTrg AFTER UPDATE ON workout
FOR EACH ROW BEGIN
    IF ((OLD.`end` IS NULL OR OLD.`end` < 1) AND NEW.`end` > 0) THEN
        DELETE FROM workoutExercise WHERE
        -- vain päivitettävään treeniin kuuluvat
        workoutId = NEW.id AND
        -- vain liikkeet jolla ei ole tehtyjä settejä
        NOT EXISTS (
            SELECT * FROM workoutExerciseSet
            -- "joinaa" DELETE-lauseen rivit
            WHERE workoutExerciseId = workoutExercise.id
        );
    END IF;
END;//
DELIMITER ;

CREATE VIEW workoutView AS
    SELECT
        w.id,
        w.`start`,
        w.`end`,
        w.notes
    FROM workout as w;

CREATE VIEW workoutExerciseView AS
    SELECT
        we.id         AS workoutExerciseId,
        we.workoutId AS workoutExerciseWorkoutId,
        e.id          AS exerciseId,
        e.`name`      AS exerciseName,
        ev.id         AS exerciseVariantId,
        ev.`content`  AS exerciseVariantName,
        s.id          AS setId,
        s.weight      AS setWeight,
        s.reps        AS setReps
    FROM workoutExercise we
    JOIN exercise e ON (e.id = we.exerciseId)
    LEFT JOIN exerciseVariant ev ON (ev.id = we.exerciseVariantId)
    LEFT JOIN workoutExerciseSet s ON (s.workoutExerciseId = we.id);