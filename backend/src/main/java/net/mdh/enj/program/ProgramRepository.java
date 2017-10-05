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

    List<Program> selectAll(SelectFilters filters) {
        return super.selectAll(filters, new ProgramMapper());
    }

    Program selectOne(SelectFilters filters) {
        return super.selectOne(filters, new ProgramMapper());
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

            private ProgramWorkoutMapper() {
                super(ID_COL);
            }

            @Override
            public Program.Workout doMapRow(ResultSet rs, int rowNum) throws SQLException {
                Program.Workout programWorkout = new Program.Workout();
                programWorkout.setId(rs.getString(ID_COL));
                programWorkout.setName(rs.getString("programWorkoutName"));
                programWorkout.setOccurrences(parseOccurrences(rs.getString("programWorkoutOccurrences")));
                programWorkout.setOrdinal(rs.getInt("programWorkoutOrdinal"));
                programWorkout.setProgramId(rs.getString("programId"));
                return programWorkout;
            }
        }
    }

    public static List<Program.Workout.Occurrence> parseOccurrences(String value) {
        List<Program.Workout.Occurrence> out = new ArrayList<>();
        // [, ja ] pois
        String spaceSeparatedPairs = value.replaceAll("[\\[\\]]", "");
        for (String pair: spaceSeparatedPairs.split(" ")) {
            String[] values = pair.split("\\,");
            out.add(new Program.Workout.Occurrence(
                Integer.valueOf(values[0]),
                !values[1].equals("null") ? Integer.valueOf(values[1]) : null
            ));
        }
        return out;
    }
}
