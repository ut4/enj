package net.mdh.enj.resources;

import net.mdh.enj.api.RequestContext;
import net.mdh.enj.auth.AuthenticationFilter;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.sync.Route;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class TestData {
    public static final String TEST_USER_ID = "69891648-07bb-4991-8035-7fbc89fb6035";
    public static final String TEST_WORKOUT_ID = "4d98360a-a077-4410-8bf1-e98532714683";
    public static final String TEST_WORKOUT_EXERCISE_ID = "cbbcefe7-00e7-45c4-9b89-75dd70bd23f4";
    public static final String MOCK_AUTH_HEADER = AuthenticationFilter.AUTH_HEADER_NAME + "foo";
    public static final Route workoutInsertRoute = new Route("workout", "POST");
    public static final Route workoutExerciseAddRoute = new Route("workout/exercise", "POST");
    public static RequestContext testUserAwareRequestContext;

    static {
        testUserAwareRequestContext = new RequestContext();
        testUserAwareRequestContext.setAuthHeader(MOCK_AUTH_HEADER);
        testUserAwareRequestContext.setUserId(TEST_USER_ID);
    }

    public static Map<String,Object> getSomeWorkoutData(String id, Long start) {
        HashMap<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("start", start);
        data.put("userId", TEST_USER_ID);
        return data;
    }
    public static Map<String,Object> getSomeWorkoutData(boolean withNewUuid) {
        return getSomeWorkoutData(UUID.randomUUID().toString(), 101L);
    }
    public static Map<String,Object> getSomeWorkoutData() {
        return getSomeWorkoutData(TEST_WORKOUT_ID, 101L);
    }

    public static Map<String,Object> getBogusWorkoutData() {
        HashMap<String, Object> data = new HashMap<>();
        data.put("start", -4L);
        return data;
    }

    public static Map<String,Object> getSomeWorkoutExerciseData(Map<String, Object> parentWorkoutData, Exercise exercise) {
        HashMap<String, Object> data = new HashMap<>();
        data.put("id", TEST_WORKOUT_EXERCISE_ID);
        data.put("orderDef", 102);
        data.put("workoutId", parentWorkoutData.get("id"));
        data.put("exercise", exercise);
        data.put("exerciseVariant", new Exercise.Variant());
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
