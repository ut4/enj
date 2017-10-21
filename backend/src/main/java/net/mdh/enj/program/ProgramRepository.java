package net.mdh.enj.program;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import net.mdh.enj.mapping.NoDupeRowMapper;
import net.mdh.enj.mapping.SubCollector;
import javax.inject.Inject;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class ProgramRepository extends BasicRepository<Program> {

    private final static String TABLE_NAME = "program";

    @Inject
    public ProgramRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    List<Program> selectAll(QueryFilters filters) {
        return super.selectAll(filters, new ProgramMapper());
    }

    Program selectOne(QueryFilters filters) {
        return super.selectOne(filters, new ProgramMapper());
    }

    int delete(Program program) {
        return super.delete(program, "id = :id AND userId = :userId");
    }

    private static final class ProgramMapper extends NoDupeRowMapper<Program> {

        private final SubCollector<Program.Workout> programWorkoutCollector;

        private ProgramMapper() {
            super("programId");
            programWorkoutCollector = new SubCollector<>(new ProgramWorkoutMapper(), "programId");
        }

        @Override
        public Program doMapRow(ResultSet rs, int rowNum) throws SQLException {
            Program program = new Program();
            program.setId(rs.getString("programId"));
            program.setName(rs.getString("programName"));
            program.setStart(rs.getLong("programStart"));
            program.setEnd(rs.getLong("programEnd"));
            program.setDescription(rs.getString("programDescription"));
            program.setUserId(rs.getString("programUserId"));
            program.setWorkouts(programWorkoutCollector.collect(rs, rowNum, program.getId()));
            return program;
        }

        private static final class ProgramWorkoutMapper extends NoDupeRowMapper<Program.Workout> {

            private static final String ID_COL = "programWorkoutId";
            private final SubCollector<Program.Workout.Exercise> exerciseCollector;

            private ProgramWorkoutMapper() {
                super(ID_COL);
                exerciseCollector = new SubCollector<>(new ProgramWorkoutExerciseMapper(), ID_COL);
            }

            @Override
            public Program.Workout doMapRow(ResultSet rs, int rowNum) throws SQLException {
                Program.Workout programWorkout = new Program.Workout();
                programWorkout.setId(rs.getString(ID_COL));
                programWorkout.setName(rs.getString("programWorkoutName"));
                programWorkout.setOccurrences(parseOccurrences(rs.getString("programWorkoutOccurrences")));
                programWorkout.setProgramId(rs.getString("programId"));
                programWorkout.setExercises(exerciseCollector.collect(rs, rowNum, programWorkout.getId()));
                return programWorkout;
            }

            private static final class ProgramWorkoutExerciseMapper extends NoDupeRowMapper<Program.Workout.Exercise> {

                ProgramWorkoutExerciseMapper() {
                    super("programWorkoutExerciseId");
                }

                @Override
                public Program.Workout.Exercise doMapRow(ResultSet rs, int rowNum) throws SQLException {
                    Program.Workout.Exercise programWorkoutExercise = new Program.Workout.Exercise();
                    programWorkoutExercise.setId(rs.getString("programWorkoutExerciseId"));
                    programWorkoutExercise.setOrdinal(rs.getInt("programWorkoutExerciseOrdinal"));
                    programWorkoutExercise.setProgramWorkoutId(rs.getString("programWorkoutExerciseProgramWorkoutId"));
                    programWorkoutExercise.setExerciseId(rs.getString("programWorkoutExerciseExerciseId"));
                    programWorkoutExercise.setExerciseName(rs.getString("programWorkoutExerciseExerciseName"));
                    programWorkoutExercise.setExerciseVariantId(rs.getString("programWorkoutExerciseVariantId"));
                    programWorkoutExercise.setExerciseVariantContent(rs.getString("programWorkoutExerciseVariantContent"));
                    return programWorkoutExercise;
                }
            }
        }
    }

    public static List<Program.Workout.Occurrence> parseOccurrences(String value) {
        List<Program.Workout.Occurrence> out = new ArrayList<>();
        // [, ja ] pois
        String spaceSeparatedGroups = value.replaceAll("[\\[\\]]", "");
        for (String group: spaceSeparatedGroups.split(" ")) {
            String[] values = group.split("\\,");
            out.add(new Program.Workout.Occurrence(
                Integer.valueOf(values[0]),
                Integer.valueOf(values[1]),
                !values[2].equals("null") ? Integer.valueOf(values[2]) : null
            ));
        }
        return out;
    }
}
