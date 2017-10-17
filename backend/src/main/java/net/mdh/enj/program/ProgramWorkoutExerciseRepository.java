package net.mdh.enj.program;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import javax.inject.Inject;
import java.util.List;

public class ProgramWorkoutExerciseRepository extends BasicRepository<Program.Workout.Exercise> {

    private final static String TABLE_NAME = "programWorkoutExercise";
    // Päivitys-, ja poistokyselyn WHERE-osio
    private final static String FILTER_Q = (
        "id = :id AND EXISTS(SELECT * FROM (" +
            "SELECT pwe.id FROM programWorkoutExercise pwe" +
            " JOIN programWorkout pw ON (pw.id = pwe.programWorkoutId)" +
            " JOIN program p ON (p.id = pw.programId)" +
            " WHERE pwe.id = :id AND p.userId = :filters.userId" +
        ") as cond)"
    );

    @Inject
    public ProgramWorkoutExerciseRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    int updateMany(List<Program.Workout.Exercise> programWorkoutExercises) {
        return super.updateMany(programWorkoutExercises, FILTER_Q);
    }

    int delete(Program.Workout.Exercise programWorkoutExercise) {
        return super.delete(programWorkoutExercise, FILTER_Q);
    }

    /**
     * Palauttaa tiedon, kuuluuko kaikki {programWorkoutExercises}:n viittaamat
     * ohjelmatreenit käyttäjälle {userId}.
     */
    boolean belongsToUser(List<Program.Workout.Exercise> programWorkoutExercises, String userId) {
        // Rakenna parametrit
        MapSqlParameterSource params = new MapSqlParameterSource();
        int c = 1;
        for (Program.Workout.Exercise programWorkoutExercise: programWorkoutExercises) {
            params.addValue("programWorkoutId" + c++, programWorkoutExercise.getProgramWorkoutId());
        }
        String programWorkoutIdPlaceholders = ":" + String.join(", :", params.getValues().keySet());
        params.addValue("userId", userId);
        // Kysele
        return super.selectAll(
            "SELECT p.id FROM program p" +
                " JOIN programWorkout pw ON (pw.programId = p.id)" +
                " WHERE p.userId != :userId AND pw.id IN(" + programWorkoutIdPlaceholders + ")",
            params,
            (rs, rowNum) -> new Program.Workout.Exercise()
        ).size() < 1;
    }
}
