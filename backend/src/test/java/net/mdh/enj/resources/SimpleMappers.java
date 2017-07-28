package net.mdh.enj.resources;

import net.mdh.enj.workout.Workout;
import org.springframework.jdbc.core.RowMapper;
import java.sql.SQLException;
import java.sql.ResultSet;

public class SimpleMappers {
    public static class WorkoutMapper implements RowMapper<Workout> {
        @Override
        public Workout mapRow(ResultSet rs, int i) throws SQLException {
            Workout workout = new Workout();
            workout.setId(rs.getString("id"));
            workout.setStart(rs.getLong("start"));
            workout.setEnd(rs.getLong("end"));
            workout.setNotes(rs.getString("notes"));
            workout.setUserId(rs.getString("userId"));
            return workout;
        }
    }
}
