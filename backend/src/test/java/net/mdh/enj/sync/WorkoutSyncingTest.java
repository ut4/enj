package net.mdh.enj.sync;

import net.mdh.enj.workout.Workout;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.BeforeClass;
import org.junit.Assert;
import org.junit.Test;

public class WorkoutSyncingTest extends RollbackingDBJerseyTest {

    private static DbTestUtils utils;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDSFactory);
    }

    @Override
    public ResourceConfig configure() {
        return SyncTestUtils.configure(rollbackingDSFactory, WorkoutSyncingTest.this);
    }

    @Test
    public void syncHandlaaPOSTPUTjaDELETEWorkoutItemit() {
        // Luo queue, jossa kaksi POST /api/workout, yksi PUT /api/workout, ja yksi DELETE /api/workout/{id}
        List<SyncQueueItem> queue = new ArrayList<>();
        Map<String, Object> workoutData = TestData.getSomeWorkoutData(true);
        queue.add(SyncTestUtils.newSyncQueueItem(1, "workout", "POST", workoutData));
        Map<String, Object> workoutData2 = TestData.getSomeWorkoutData(true);
        queue.add(SyncTestUtils.newSyncQueueItem(2, "workout", "POST", workoutData2));
        Map<String, Object> updated = new HashMap<>();
        updated.putAll(workoutData);
        updated.put("start", "2");
        updated.put("notes", "fd");
        queue.add(SyncTestUtils.newSyncQueueItem(3, "workout", "PUT", new Object[]{updated}));
        queue.add(SyncTestUtils.newSyncQueueItem(4, "workout/" + workoutData2.get("id"), "DELETE", null));
        //
        Response response = this.newPostRequest("sync", queue);
        Assert.assertEquals(200, response.getStatus());
        //
        List syncedData = utils.selectAllWhere(
            "SELECT * FROM workout WHERE id IN(:id1, :id2)",
            new MapSqlParameterSource().addValue("id1", workoutData.get("id")).addValue("id2", workoutData2.get("id")),
            new SimpleMappers.WorkoutMapper()
        );
        Assert.assertEquals("Pitäisi löytyä vain 1 itemi", 1, syncedData.size());
        Workout syncedWorkout = (Workout) syncedData.get(0);
        Assert.assertEquals("Tietokannasta pitäisi löytyä tuorein data",
            updated.get("start")+"-"+updated.get("notes"),
            syncedWorkout.getStart()+"-"+syncedWorkout.getNotes()
        );
    }

    /*@Test TODO
    public void syncHandlaaPOSTPUTjaDELETEWorkoutExerciseItemit() {
    }

    @Test TODO
    public void syncHandlaaPOSTPUTjaDELETEWorkoutExerciseSetItemit() {
    }*/
}
