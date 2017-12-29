package net.mdh.enj.workout;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.SubCollector;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.mapping.NoDupeRowMapper;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import java.sql.SQLException;
import javax.inject.Inject;
import java.sql.ResultSet;
import java.util.List;

public class WorkoutRepository extends BasicRepository<Workout> {

    private final static String TABLE_NAME = "workout";
    private final int DEFAULT_RESULT_LIMIT = 50;

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
        filters.setLimit(DEFAULT_RESULT_LIMIT);
        return this.selectAll(filters, "");
    }

    /**
     * Palauttaa yhden treenin, jonka start < startTo, tai start > startFrom.
     */
    List<Workout> selectNext(SearchFilters filters) {
        filters.setLimit(1);
        return this.selectAll(filters, " ORDER BY workoutStart " + (filters.getStartFrom() != null ? "ASC" : "DESC"));
    }

    /**
     * Palauttaa {limit} treeniä tietokannasta, jotka matchaa hakuperusteisiin
     * {filters} (jos niitä on), "uusin ensin" -järjestyksessä.
     *
     * @return treenit
     */
    List<Workout> selectAll(SearchFilters filters, String order) {
        return super.selectAll(
            String.format(
                "SELECT wv.*, wev.* " +
                "FROM (SELECT * FROM workoutView%s%s LIMIT :limit) wv " +
                "LEFT JOIN workoutExerciseView wev ON (wev.workoutExerciseWorkoutId = wv.workoutId) " +
                "ORDER BY wv.workoutStart DESC",
                filters.hasRules() ? " WHERE " + filters.toSql() : "",
                filters.hasRules() ? order : ""
            ),
            filters.hasRules() ? new BeanPropertySqlParameterSource(filters) : null,
            new WorkoutMapper()
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
        private static final class WorkoutExerciseMapper extends NoDupeRowMapper<Workout.Exercise> {

            private static final String ID_COL = "workoutExerciseId";
            private final SubCollector<Workout.Exercise.Set> setCollector;

            private WorkoutExerciseMapper() {
                super(ID_COL);
                this.setCollector = new SubCollector<>(new NoDupeSetMapper(), ID_COL);
            }

            @Override
            public Workout.Exercise doMapRow(ResultSet rs, int rowNum) throws SQLException {
                Workout.Exercise workoutExercise = new Workout.Exercise();
                workoutExercise.setId(rs.getString(ID_COL));
                workoutExercise.setOrdinal(rs.getInt("workoutExerciseOrdinal"));
                workoutExercise.setWorkoutId(rs.getString("workoutExerciseWorkoutId"));
                workoutExercise.setExerciseId(rs.getString("exerciseId"));
                workoutExercise.setExerciseName(rs.getString("exerciseName"));
                workoutExercise.setExerciseVariantId(rs.getString("exerciseVariantId"));
                workoutExercise.setExerciseVariantContent(rs.getString("exerciseVariantContent"));
                workoutExercise.setSets(this.setCollector.collect(rs, rowNum, workoutExercise.getId()));
                return workoutExercise;
            }

            /**
             * Luo Workout.Exercise.Set-beaneja resultSet-rivin tiedoilla.
             */
            private static final class NoDupeSetMapper extends NoDupeRowMapper<Workout.Exercise.Set> {

                NoDupeSetMapper() {
                    super("workoutExerciseSetId");
                }

                @Override
                public Workout.Exercise.Set doMapRow(ResultSet rs, int rowNum) throws SQLException {
                    Workout.Exercise.Set set = new Workout.Exercise.Set();
                    set.setId(rs.getString("workoutExerciseSetId"));
                    set.setWeight(rs.getDouble("workoutExerciseSetWeight"));
                    set.setReps(rs.getInt("workoutExerciseSetReps"));
                    set.setOrdinal(rs.getInt("workoutExerciseSetOrdinal"));
                    set.setWorkoutExerciseId(rs.getString("workoutExerciseSetWorkoutExerciseId"));
                    return set;
                }
            }
        }
    }
}
