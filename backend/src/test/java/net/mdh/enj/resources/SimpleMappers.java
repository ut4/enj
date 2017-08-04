package net.mdh.enj.resources;

import net.mdh.enj.workout.Workout;
import net.mdh.enj.exercise.Exercise;
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
    public static class WorkoutExerciseMapper implements RowMapper<Workout.Exercise> {
        @Override
        public Workout.Exercise mapRow(ResultSet rs, int i) throws SQLException {
            Workout.Exercise we = new Workout.Exercise();
            we.setId(rs.getString("id"));
            we.setOrderDef(rs.getInt("orderDef"));
            we.setWorkoutId(rs.getString("workoutId"));
            Exercise e = new Exercise();
            e.setId(rs.getString("exerciseId"));
            we.setExercise(e);
            Exercise.Variant v = new Exercise.Variant();
            v.setId(rs.getString("exerciseVariantId"));
            we.setExerciseVariant(v);
            return we;
        }
    }
    public static class WorkoutExerciseSetMapper implements RowMapper<Workout.Exercise.Set> {
        @Override
        public Workout.Exercise.Set mapRow(ResultSet rs, int i) throws SQLException {
            Workout.Exercise.Set set = new Workout.Exercise.Set();
            set.setId(rs.getString("id"));
            set.setWeight(rs.getDouble("weight"));
            set.setReps(rs.getInt("reps"));
            set.setWorkoutExerciseId(rs.getString("workoutExerciseId"));
            return set;
        }
    }
}
