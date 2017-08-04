DROP VIEW    IF EXISTS workoutExerciseView;
DROP VIEW    IF EXISTS workoutView;
DROP TRIGGER IF EXISTS workoutEndTrg;
DROP TABLE   IF EXISTS workoutExerciseSet;
DROP TABLE   IF EXISTS workoutExercise;
DROP TABLE   IF EXISTS workout;
DROP VIEW    IF EXISTS exerciseView;
DROP TABLE   IF EXISTS exerciseVariant;
DROP TABLE   IF EXISTS exercise;
DROP VIEW    IF EXISTS userView;
DROP TABLE   IF EXISTS `user`;

-- == User ====
-- =============================================================================
CREATE TABLE `user` (
    id CHAR(36) NOT NULL,
    username VARCHAR(42) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE VIEW userView AS
    SELECT
        u.id           AS userId,
        u.username     AS userUsername,
        u.passwordHash AS userPasswordHash
    FROM `user` AS u;

-- == Exercise ====
-- =============================================================================
CREATE TABLE exercise (
    id CHAR(36) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE exerciseVariant (
    id CHAR(36) NOT NULL,
    content VARCHAR(32) NOT NULL,
    exerciseId CHAR(36) NOT NULL,
    FOREIGN KEY (exerciseId) REFERENCES exercise(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE VIEW exerciseView AS
    SELECT
        e.id       AS exerciseId,
        e.`name`   AS exerciseName,
        ev.id      AS exerciseVariantId,
        ev.content AS exerciseVariantContent
    FROM exercise e
    LEFT JOIN exerciseVariant ev ON (ev.exerciseId = e.id);

-- == Workout ====
-- =============================================================================
CREATE TABLE workout (
    id CHAR(36) NOT NULL,
    `start` INT UNSIGNED NOT NULL,
    `end` INT UNSIGNED NOT NULL DEFAULT 0,
    notes TEXT,
    userId CHAR(36) NOT NULL,
    FOREIGN KEY (userId) REFERENCES `user`(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE workoutExercise (
    id CHAR(36) NOT NULL,
    orderDef TINYINT(1) UNSIGNED NOT NULL,
    workoutId CHAR(36) NOT NULL,
    exerciseId CHAR(36) NOT NULL,
    exerciseVariantId CHAR(36) DEFAULT NULL,
    FOREIGN KEY (workoutId) REFERENCES workout(id),
    FOREIGN KEY (exerciseId) REFERENCES exercise(id),
    FOREIGN KEY (exerciseVariantId) REFERENCES exerciseVariant(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE workoutExerciseSet (
    id CHAR(36) NOT NULL,
    weight FLOAT NOT NULL,
    reps SMALLINT UNSIGNED NOT NULL,
    workoutExerciseId CHAR(36) NOT NULL,
    FOREIGN KEY (workoutExerciseId) REFERENCES workoutExercise(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

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
        w.id      AS workoutId,
        w.`start` AS workoutStart,
        w.`end`   AS workoutEnd,
        w.notes   AS workoutNotes,
        w.userId  AS workoutUserId
    FROM workout AS w;

CREATE VIEW workoutExerciseView AS
    SELECT
        we.id         AS workoutExerciseId,
        we.orderDef   AS workoutExerciseOrderDef,
        we.workoutId  AS workoutExerciseWorkoutId,
        e.id          AS exerciseId,
        e.`name`      AS exerciseName,
        ev.id         AS exerciseVariantId,
        ev.`content`  AS exerciseVariantContent,
        s.id          AS workoutExerciseSetId,
        s.weight      AS workoutExerciseSetWeight,
        s.reps        AS workoutExerciseSetReps,
        s.workoutExerciseId AS workoutExerciseSetWorkoutExerciseId
    FROM workoutExercise we
    JOIN exercise e ON (e.id = we.exerciseId)
    LEFT JOIN exerciseVariant ev ON (ev.id = we.exerciseVariantId)
    LEFT JOIN workoutExerciseSet s ON (s.workoutExerciseId = we.id);
