package net.mdh.enj.resources;

import net.mdh.enj.user.User;
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
            we.setOrdinal(rs.getInt("ordinal"));
            we.setWorkoutId(rs.getString("workoutId"));
            we.setExerciseId(rs.getString("exerciseId"));
            we.setExerciseVariantId(rs.getString("exerciseVariantId"));
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
            set.setOrdinal(rs.getInt("ordinal"));
            set.setWorkoutExerciseId(rs.getString("workoutExerciseId"));
            return set;
        }
    }
    public static class ExerciseMapper implements RowMapper<Exercise> {
        @Override
        public Exercise mapRow(ResultSet resultSet, int i) throws SQLException {
            Exercise exercise = new Exercise();
            exercise.setId(resultSet.getString("id"));
            exercise.setName(resultSet.getString("name"));
            exercise.setUserId(resultSet.getString("userId"));
            return exercise;
        }
    }
    public static class UserMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int i) throws SQLException {
            User user = new User();
            user.setId(rs.getString("id"));
            user.setUsername(rs.getString("username"));
            user.setPasswordHash(rs.getString("passwordHash"));
            user.setBodyWeight(rs.getDouble("bodyWeight"));
            user.setIsMale(rs.getInt("isMale"));
            return user;
        }
    }
}
