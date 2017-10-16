DROP VIEW    IF EXISTS programView;
DROP TRIGGER IF EXISTS programDeleteTrg;
DROP TABLE   IF EXISTS programWorkoutExercise;
DROP TABLE   IF EXISTS programWorkout;
DROP TABLE   IF EXISTS program;
DROP VIEW    IF EXISTS setProgressView;
DROP VIEW    IF EXISTS bestSetView;
DROP VIEW    IF EXISTS workoutExerciseView;
DROP VIEW    IF EXISTS workoutView;
DROP TRIGGER IF EXISTS bestSetAddTrg;
DROP TRIGGER IF EXISTS workoutExerciseDeleteTrg;
DROP TRIGGER IF EXISTS workoutDeleteTrg;
DROP TRIGGER IF EXISTS workoutEndTrg;
DROP TABLE   IF EXISTS bestSet;
DROP TABLE   IF EXISTS workoutExerciseSet;
DROP TABLE   IF EXISTS workoutExercise;
DROP TABLE   IF EXISTS workout;
DROP VIEW    IF EXISTS exerciseView;
DROP TABLE   IF EXISTS exerciseVariant;
DROP TABLE   IF EXISTS exercise;
DROP VIEW    IF EXISTS authUserView;
DROP VIEW    IF EXISTS userView;
DROP TABLE   IF EXISTS `user`;

-- == User ====
-- =============================================================================
CREATE TABLE `user` (
    id CHAR(36) NOT NULL,
    username VARCHAR(42) NOT NULL UNIQUE,
    email VARCHAR(191) NOT NULL UNIQUE, -- 191 * 4 = 767 bytes = max key length
    createdAt INT UNSIGNED NOT NULL,
    -- Autentikaatioon liittyvät
    passwordHash VARCHAR(255) NOT NULL,
    lastLogin INT UNSIGNED DEFAULT NULL,
    currentToken VARCHAR(255) DEFAULT NULL,
    isActivated TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
    activationKey VARCHAR(64) DEFAULT NULL,
    -- Vapaaehtoiset kentät
    bodyWeight FLOAT UNSIGNED DEFAULT NULL,
    isMale TINYINT(1) UNSIGNED DEFAULT NULL, -- NULL = en halua kertoa, 1 = mies, 0 = nainen
    signature VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE VIEW userView AS
    SELECT
        u.id         AS userId,
        u.username   AS userUsername,
        u.email      AS userEmail,
        u.isActivated AS userIsActivated,
        u.bodyWeight AS userBodyWeight,
        u.isMale     AS userIsMale,
        u.signature  AS userSignature
    FROM `user` AS u;

CREATE VIEW authUserView AS
    SELECT
        u.id           AS userId,
        u.username     AS userUsername,
        u.email        AS userEmail,
        u.createdAt    AS userCreatedAt,
        u.passwordHash AS userPasswordHash,
        u.lastLogin    AS userLastLogin,
        u.currentToken AS userCurrentToken,
        u.isActivated  AS userIsActivated,
        u.activationKey AS userActivationKey
    FROM `user` AS u;

-- == Exercise ====
-- =============================================================================
CREATE TABLE exercise (
    id CHAR(36) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    userId CHAR(36) DEFAULT NULL, -- NULL = Globaali liike, !NULL = Käyttäjäkohtainen liike
    FOREIGN KEY (userId) REFERENCES `user`(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE exerciseVariant (
    id CHAR(36) NOT NULL,
    content VARCHAR(64) NOT NULL,
    exerciseId CHAR(36) NOT NULL,
    userId CHAR(36) DEFAULT NULL, -- NULL = Globaali liike, !NULL = Käyttäjäkohtainen liike
    FOREIGN KEY (exerciseId) REFERENCES exercise(id),
    FOREIGN KEY (userId) REFERENCES `user`(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE VIEW exerciseView AS
    SELECT
        e.id       AS exerciseId,
        e.`name`   AS exerciseName,
        e.userId   AS exerciseUserId,
        ev.id      AS exerciseVariantId,
        ev.content AS exerciseVariantContent,
        ev.userId  AS exerciseVariantUserId
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
    ordinal TINYINT UNSIGNED NOT NULL,
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
    ordinal TINYINT UNSIGNED NOT NULL,
    workoutExerciseId CHAR(36) NOT NULL,
    FOREIGN KEY (workoutExerciseId) REFERENCES workoutExercise(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE bestSet (
    workoutExerciseSetId CHAR(36) NOT NULL,
    exerciseId CHAR(36) NOT NULL,
    FOREIGN KEY (workoutExerciseSetId) REFERENCES workoutExerciseSet(id),
    FOREIGN KEY (exerciseId) REFERENCES exercise(id),
    PRIMARY KEY (workoutExerciseSetId, exerciseId)
) DEFAULT CHARSET = utf8mb4;

DELIMITER //
-- Treenin valmiiksi merkkauksen yhteydessä ajautuva triggeri joka poistaa
-- treenin "tyhjät" liikkeet (jolla ei tehtyjä settejä)
CREATE TRIGGER workoutEndTrg AFTER UPDATE ON workout
FOR EACH ROW BEGIN
    IF ((OLD.`end` IS NULL OR OLD.`end` < 1) AND NEW.`end` > 0) THEN
        SET @blankWorkoutExerciseIds = (
            SELECT GROUP_CONCAT(we.id) AS ids FROM workoutExercise we
            -- vain päivitettävään treeniin kuuluvat
            WHERE we.workoutId = NEW.id AND NOT EXISTS(
                SELECT * FROM workoutExerciseSet
                -- "joinaa" DELETE-lauseen rivit
                WHERE workoutExerciseId = we.id
            )
        );
        DELETE FROM workoutExercise WHERE FIND_IN_SET(id, @blankWorkoutExerciseIds);
    END IF;
END;//

-- Treenin poiston yhteydessä ajautuva triggeri, joka poistaa kaikki treeniin
-- kuuluvat liikkeet ennen varsinaista poistoa
CREATE TRIGGER workoutDeleteTrg BEFORE DELETE ON workout
FOR EACH ROW BEGIN
    DELETE FROM workoutExercise WHERE workoutId = OLD.id;
END;//

-- Treeniliikkeen poiston yhteydessä ajautuva triggeri, joka poistaa kaikki sille
-- kuuluvat sarjat + ennätykset ennen varsinaista poistoa
CREATE TRIGGER workoutExerciseDeleteTrg BEFORE DELETE ON workoutExercise
FOR EACH ROW BEGIN
    -- bestSet, täytyy ajaa ennen & erikseen ettei constraint-failaa
    DELETE bestSet FROM bestSet
    JOIN workoutExerciseSet ws ON ws.id = bestSet.workoutExerciseSetId
    WHERE ws.workoutExerciseId = OLD.id;
    -- workoutExerciseSet
    DELETE FROM workoutExerciseSet WHERE workoutExerciseId = OLD.id;
END;//

-- Treeniliikesarjan insertoinnin jälkeen ajautuva triggeri, joka lisää sarjan
-- bestSet-tauluun, mikäli siinä on tähän mennessä suurin nostettu paino
CREATE TRIGGER bestSetAddTrg AFTER INSERT ON workoutExerciseSet
FOR EACH ROW BEGIN
    SET @exerciseId = (
        SELECT exerciseId FROM workoutExercise
        WHERE id = NEW.workoutExerciseId
    );
    IF (NOT EXISTS(
        SELECT * FROM bestSet bs
        JOIN workoutExerciseSet wes ON (wes.id = bs.workoutExerciseSetId)
        -- https://en.wikipedia.org/wiki/One-repetition_maximum#O.27Conner_et_al.
        WHERE bs.exerciseId = @exerciseId AND
            IF(wes.reps > 1, wes.weight*(wes.reps/40+1), wes.weight) >=
            IF(NEW.reps > 1, NEW.weight*(NEW.reps/40+1), NEW.weight)
    )) THEN
        INSERT INTO bestSet (workoutExerciseSetId, exerciseId)
            VALUES (NEW.id, @exerciseId);
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
        we.id        AS workoutExerciseId,
        we.ordinal   AS workoutExerciseOrdinal,
        we.workoutId AS workoutExerciseWorkoutId,
        e.id         AS exerciseId,
        e.`name`     AS exerciseName,
        ev.id        AS exerciseVariantId,
        ev.`content` AS exerciseVariantContent,
        s.id         AS workoutExerciseSetId,
        s.weight     AS workoutExerciseSetWeight,
        s.reps       AS workoutExerciseSetReps,
        s.ordinal    AS workoutExerciseSetOrdinal,
        s.workoutExerciseId AS workoutExerciseSetWorkoutExerciseId
    FROM workoutExercise we
    JOIN exercise e ON (e.id = we.exerciseId)
    LEFT JOIN exerciseVariant ev ON (ev.id = we.exerciseVariantId)
    LEFT JOIN workoutExerciseSet s ON (s.workoutExerciseId = we.id);

CREATE VIEW bestSetView AS
    SELECT
        MIN(wes.weight)          AS startWeight,
        MAX(wes.weight)          AS bestWeight,
        MAX(wes.reps)            AS bestWeightReps,
        COUNT(bs.exerciseId) - 1 AS timesImproved,
        e.`name`                 AS exerciseName,
        wes.id                   AS workoutExerciseSetId,
        w.userId                 AS userId
    FROM bestSet bs
    JOIN workoutExerciseSet wes ON (wes.id = bs.workoutExerciseSetId)
    JOIN exercise e ON (e.id = bs.exerciseId)
    JOIN workout w ON (w.id = (SELECT workoutId FROM workoutExercise WHERE id = wes.workoutExerciseId))
    GROUP BY bs.exerciseId;

CREATE VIEW setProgressView AS
    SELECT
        wes.weight AS weight,
        wes.reps   AS reps,
        w.`start`  AS liftedAt,
        e.id       AS exerciseId,
        e.`name`   AS exerciseName,
        w.userId   AS userId
    FROM bestSet bs
    JOIN workoutExerciseSet wes ON (wes.id = bs.workoutExerciseSetId)
    JOIN exercise e ON (e.id = bs.exerciseId)
    JOIN workout w ON (w.id = (SELECT workoutId FROM workoutExercise WHERE id = wes.workoutExerciseId));

-- == Program ====
-- =============================================================================
CREATE TABLE program (
    id CHAR(36) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `start` INT UNSIGNED NOT NULL,
    `end` INT UNSIGNED NOT NULL,
    description VARCHAR(128) DEFAULT NULL,
    userId CHAR(36) NOT NULL,
    FOREIGN KEY (userId) REFERENCES `user`(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE programWorkout (
    id CHAR(36) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    occurrences TEXT NOT NULL, -- csv
    ordinal TINYINT UNSIGNED NOT NULL,
    programId CHAR(36) NOT NULL,
    FOREIGN KEY (programId) REFERENCES program(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE programWorkoutExercise (
    id CHAR(36) NOT NULL,
    ordinal TINYINT UNSIGNED NOT NULL,
    programWorkoutId CHAR(36) NOT NULL,
    exerciseId CHAR(36) NOT NULL,
    exerciseVariantId CHAR(36) DEFAULT NULL,
    FOREIGN KEY (programWorkoutId) REFERENCES programWorkout(id),
    FOREIGN KEY (exerciseId) REFERENCES exercise(id),
    FOREIGN KEY (exerciseVariantId) REFERENCES exerciseVariant(id),
    PRIMARY KEY (id)
) DEFAULT CHARSET = utf8mb4;

DELIMITER //
-- Ohjelman poiston yhteydessä ajautuva triggeri, joka poistaa kaikki ohjelmaan
-- kuuluvat ohjelmatreenit, ja ohjelmatreeniliikkeet ennen varsinaista poistoa
CREATE TRIGGER programDeleteTrg BEFORE DELETE ON program
FOR EACH ROW BEGIN
    DELETE FROM programWorkoutExercise WHERE programWorkoutId = (
        SELECT programWorkoutId FROM programWorkout WHERE programId = OLD.id
    );
    DELETE FROM programWorkout WHERE programId = OLD.id;
END;//
DELIMITER ;

CREATE VIEW programView AS
    SELECT
        p.id          AS programId,
        p.`name`      AS programName,
        p.`start`     AS programStart,
        p.`end`       AS programEnd,
        p.description AS programDescription,
        p.userId      AS programUserId,
        pw.id         AS programWorkoutId,
        pw.name       AS programWorkoutName,
        pw.occurrences AS programWorkoutOccurrences,
        pw.ordinal    AS programWorkoutOrdinal,
        pw.programId  AS programWorkoutProgramId
    FROM program p
    JOIN programWorkout pw ON (pw.programId = p.id);
