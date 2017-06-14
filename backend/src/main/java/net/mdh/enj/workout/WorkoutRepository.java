package net.mdh.enj.workout;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.mapping.NoDupeRowMapper;
import net.mdh.enj.mapping.SubCollector;
import javax.inject.Inject;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.List;

public class WorkoutRepository extends BasicRepository<Workout> {

    public final static String TABLE_NAME = "workout";
    private final static String VIEW_NAME = TABLE_NAME + "View";
    private final static String REL_VIEW_NAME = TABLE_NAME + "ExerciseView";

    @Inject
    public WorkoutRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    /**
     * Palauttaa kaikki treenit tietokannasta "uusin ensin"-järjestuksessä.
     *
     * @return treenit
     */
    public List<Workout> selectAll() {
        return super.selectAll(
            String.format(
                "SELECT " +
                    "wv.*, wev.* " +
                "FROM (select * from %s limit 5) wv " +
                "LEFT JOIN %s wev ON (wev.workoutExerciseWorkoutId = wv.id) " +
                "ORDER BY wv.id DESC",
                VIEW_NAME,
                REL_VIEW_NAME
            ),
            new WorkoutMapper()
        );
    }

    private static final class WorkoutMapper extends NoDupeRowMapper<Workout> {

        private final SubCollector<Workout.Exercise> workoutExerciseCollector;

        private WorkoutMapper() {
            super("id");
            workoutExerciseCollector = new SubCollector<>(new WorkoutExerciseMapper(), "id");
        }

        @Override
        public Workout doMapRow(ResultSet rs, int rowNum) throws SQLException {
            Workout workout = new Workout();
            workout.setId(rs.getInt("id"));
            workout.setStart(rs.getLong("start"));
            workout.setEnd(rs.getLong("end"));
            workout.setNotes(rs.getString("notes"));
            workout.setExercises(this.workoutExerciseCollector.collect(rs, rowNum, workout.getId()));
            return workout;
        }

        /**
         * Luo Workout.Exercise-beaneja resultSet-rivin tiedoilla.
         */
        private final class WorkoutExerciseMapper extends NoDupeRowMapper<Workout.Exercise> {

            private static final String ID_COL = "workoutExerciseId";
            private final SubCollector<Workout.Exercise.Set> setCollector;

            private WorkoutExerciseMapper() {
                super(ID_COL);
                setCollector = new SubCollector<>(new SetMapper(), ID_COL);
            }

            @Override
            public Workout.Exercise doMapRow(ResultSet rs, int rowNum) throws SQLException {
                Workout.Exercise workoutExercise = new Workout.Exercise();
                workoutExercise.setId(rs.getInt(ID_COL));
                workoutExercise.setExerciseName(rs.getString("exerciseName"));
                workoutExercise.setSets(this.setCollector.collect(rs, rowNum, workoutExercise.getId()));
                return workoutExercise;
            }

            /**
             * Luo Workout.Exercise.Set-beaneja resultSet-rivin tiedoilla.
             */
            private final class SetMapper extends NoDupeRowMapper<Workout.Exercise.Set> {

                SetMapper() {
                    super("setId");
                }

                @Override
                public Workout.Exercise.Set doMapRow(ResultSet rs, int rowNum) throws SQLException {
                    Workout.Exercise.Set set = new Workout.Exercise.Set();
                    set.setId(rs.getInt("setId"));
                    set.setWeight(rs.getDouble("setWeight"));
                    set.setReps(rs.getInt("setReps"));
                    return set;
                }
            }
        }
    }
}
