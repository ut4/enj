package net.mdh.enj.program;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import javax.inject.Inject;
import java.util.List;

public class ProgramWorkoutRepository extends BasicRepository<Program.Workout> {

    private final static String TABLE_NAME = "programWorkout";
    // Päivitys-, ja poistokyselyn WHERE-osio
    private final static String FILTER_Q = (
        "id = :id AND EXISTS(SELECT userId FROM (" +
            " SELECT p.userId FROM program p" +
            " JOIN programWorkout pw ON (pw.programId = p.id)" +
            " WHERE p.userId = :filters.userId AND pw.id = :id" +
        " ) as cond)"
    );

    @Inject
    public ProgramWorkoutRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    int updateMany(List<Program.Workout> programWorkouts) {
        return super.updateMany(programWorkouts, FILTER_Q);
    }

    int delete(Program.Workout programWorkout) {
        return super.delete(programWorkout, FILTER_Q);
    }

    /**
     * Palauttaa tiedon, kuuluuko kaikki {programWorkouts}:n viittaamat ohjelmat
     * käyttäjälle {userId}.
     */
    boolean belongsToUser(List<Program.Workout> programWorkouts, String userId) {
        // Rakenna parametrit
        MapSqlParameterSource params = new MapSqlParameterSource();
        int c = 1;
        for (Program.Workout programWorkout: programWorkouts) {
            params.addValue("programId" + c++, programWorkout.getProgramId());
        }
        String programIdPlaceholders = ":" + String.join(", :", params.getValues().keySet());
        params.addValue("userId", userId);
        // Kysele
        return super.selectAll(
            "SELECT p.id FROM program p WHERE p.userId != :userId AND p.id IN(" + programIdPlaceholders + ")",
            params,
            (rs, rowNum) -> new Program.Workout()
        ).size() < 1;
    }
}
