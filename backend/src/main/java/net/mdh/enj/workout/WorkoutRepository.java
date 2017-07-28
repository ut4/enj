package net.mdh.enj.workout;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.exercise.ExerciseRepository;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.mapping.NoDupeRowMapper;
import net.mdh.enj.mapping.SubCollector;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import javax.inject.Inject;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.List;

public class WorkoutRepository extends BasicRepository<Workout> {

    private final static String TABLE_NAME = "workout";

    @Inject
    WorkoutRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    /**
     * Palauttaa {this.DEFAULT_RESULT_LIMIT} treeniä tietokannasta, jotka matchaa
     * hakuperusteisiin {filters} (jos niitä on), "uusin ensin" -järjestyksessä.
     *
     * @return treenit
     */
    List<Workout> selectAll(SearchFilters filters) {
        final int DEFAULT_RESULT_LIMIT = 50;
        return this.selectAll(filters, DEFAULT_RESULT_LIMIT);
    }

    /**
     * Palauttaa {limit} treeniä tietokannasta, jotka matchaa hakuperusteisiin
     * {filters} (jos niitä on), "uusin ensin" -järjestyksessä.
     *
     * @return treenit
     */
    List<Workout> selectAll(SearchFilters filters, int limit) {
        return super.selectAll(
            String.format(
                "SELECT wv.*, wev.* " +
                "FROM (SELECT * FROM workoutView%s LIMIT %d) wv " +
                "LEFT JOIN workoutExerciseView wev ON (wev.workoutExerciseWorkoutId = wv.workoutId) " +
                "ORDER BY wv.workoutStart DESC",
                filters.hasRules() ? " WHERE " + filters.toSql() : "",
                limit
            ),
            filters.hasRules() ? new BeanPropertySqlParameterSource(filters) : null,
            new WorkoutMapper()
        );
    }

    /**
     * Päivittää kaikki treenit, ja palauttaa päivitettyjen rivien lukumäärän.
     *
     * @return {int} Päivitettyjen rivien lukumäärä
     */
    int updateMany(List<Workout> workouts) {
        return super.updateMany(
            "UPDATE workout SET `start` = :start, `end` = :end, `notes` = :notes WHERE id = :id",
            workouts
        );
    }

    private static final class WorkoutMapper extends NoDupeRowMapper<Workout> {

        private final SubCollector<Workout.Exercise> workoutExerciseCollector;

        private WorkoutMapper() {
            super("workoutId");
            workoutExerciseCollector = new SubCollector<>(new WorkoutExerciseMapper(), "workoutId");
        }

        @Override
        public Workout doMapRow(ResultSet rs, int rowNum) throws SQLException {
            Workout workout = new Workout();
            workout.setId(rs.getString("workoutId"));
            workout.setStart(rs.getLong("workoutStart"));
            workout.setEnd(rs.getLong("workoutEnd"));
            workout.setNotes(rs.getString("workoutNotes"));
            workout.setUserId(rs.getString("workoutUserId"));
            workout.setExercises(this.workoutExerciseCollector.collect(rs, rowNum, workout.getId()));
            return workout;
        }

        /**
         * Luo Workout.Exercise-beaneja resultSet-rivin tiedoilla.
         */
        private final class WorkoutExerciseMapper extends NoDupeRowMapper<Workout.Exercise> {

            private static final String ID_COL = "workoutExerciseId";
            private final SubCollector<Workout.Exercise.Set> setCollector;
            private final ExerciseRepository.ExerciseMapper exerciseMapper;

            private WorkoutExerciseMapper() {
                super(ID_COL);
                this.setCollector = new SubCollector<>(new SetMapper(), ID_COL);
                this.exerciseMapper = new ExerciseRepository.ExerciseMapper();
            }

            @Override
            public Workout.Exercise doMapRow(ResultSet rs, int rowNum) throws SQLException {
                Workout.Exercise workoutExercise = new Workout.Exercise();
                workoutExercise.setId(rs.getString(ID_COL));
                workoutExercise.setWorkoutId(rs.getString("workoutExerciseWorkoutId"));
                workoutExercise.setSets(this.setCollector.collect(rs, rowNum, workoutExercise.getId()));
                workoutExercise.setExercise(this.exerciseMapper.doMapRow(rs, rowNum));
                return workoutExercise;
            }

            /**
             * Luo Workout.Exercise.Set-beaneja resultSet-rivin tiedoilla.
             */
            private final class SetMapper extends NoDupeRowMapper<Workout.Exercise.Set> {

                SetMapper() {
                    super("workoutExerciseSetId");
                }

                @Override
                public Workout.Exercise.Set doMapRow(ResultSet rs, int rowNum) throws SQLException {
                    Workout.Exercise.Set set = new Workout.Exercise.Set();
                    set.setId(rs.getString("workoutExerciseSetId"));
                    set.setWeight(rs.getDouble("workoutExerciseSetWeight"));
                    set.setReps(rs.getInt("workoutExerciseSetReps"));
                    return set;
                }
            }
        }
    }
}
