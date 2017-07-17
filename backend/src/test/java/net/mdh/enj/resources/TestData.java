package net.mdh.enj.resources;

import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.sync.Route;
import java.util.HashMap;
import java.util.Map;

public class TestData {
    public static final int TEST_USER_ID = 1;
    public static final Route workoutInsertRoute = new Route("workout", "POST");
    public static final Route workoutExerciseAddRoute = new Route("workout/exercise", "POST");

    public static Map<String,Object> getSomeWorkoutData(Integer id, Long start) {
        HashMap<String, Object> data = new HashMap<>();
        data.put("id", id); // frontendin generoima väliaikainen id
        data.put("start", start);
        data.put("userId", TEST_USER_ID);
        return data;
    }
    public static Map<String,Object> getSomeWorkoutData() {
        return getSomeWorkoutData(4, 101L);
    }

    public static Map<String,Object> getBogusWorkoutData() {
        HashMap<String, Object> data = new HashMap<>();
        data.put("id", 0);
        return data;
    }

    public static Map<String,Object> getSomeWorkoutExerciseData(Map<String, Object> parentWorkoutData, Exercise exercise) {
        HashMap<String, Object> data = new HashMap<>();
        data.put("id", 5); // frontendin generoima väliaikainen id
        data.put("orderDef", 102);
        data.put("exercise", exercise);
        data.put("workoutId", parentWorkoutData.get("id"));
        return data;
    }
    public static Map<String,Object> getSomeWorkoutExerciseData(Map<String, Object> parentWorkoutData) {
        return getSomeWorkoutExerciseData(parentWorkoutData, new Exercise());
    }

    public static Map<String, Object> getSomeJunkData() {
        HashMap<String, Object> data = new HashMap<>();
        data.put("foo", "bar");
        return data;
    }
}
