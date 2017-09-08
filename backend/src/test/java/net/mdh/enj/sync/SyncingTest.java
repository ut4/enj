package net.mdh.enj.sync;

import net.mdh.enj.workout.Workout;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.TestController;
import net.mdh.enj.auth.AuthenticationFilter;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.glassfish.jersey.server.validation.ValidationError;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.BeforeClass;
import org.junit.Assert;
import org.junit.Test;

public class SyncingTest extends RollbackingDBJerseyTest {

    private static DbTestUtils utils;
    private static Exercise testExercise;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDataSource);
        testExercise = new Exercise();
        testExercise.setName("exs");
        utils.insertExercise(testExercise);
    }

    @Override
    public ResourceConfig configure() {
        return SyncTestUtils.configure(rollbackingDSFactory, SyncingTest.this);
    }

    @Test
    public void syncAllHylkääPyynnönJosHetiEnsimmäinenSynkkaysEpäonnistuu() {
        //
        Response response = this.newPostRequest("sync", this.makeSyncQueueWithBogusData());
        // Assertoi että yritti synkata ensimmäisen itemin, ja repi sen jälkeen pelihousunsa
        Assert.assertNotEquals(200, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals("WorkoutController.insert.arg0.start", errors.get(0).getPath());
    }

    @Test
    public void syncAllPalauttaaOnnistuneestiSynkattujenItemeidenIdtFailauksestaHuolimatta() {
        // Simuloi tilanne, jossa synkkaujonon toinen itemi failaa
        List<SyncQueueItem> queue = this.makeSyncQueueWithCoupleOfItems();
        queue.get(0).setData(TestData.getSomeWorkoutData(true));
        Response response = this.newPostRequest("sync", queue);
        // Assertoi että ei repinyt pelihousujansa, vaan palautti onnistuneesti synkattujen itemeiden id:t
        Assert.assertEquals("Ei pitäisi heittää erroria, koska 1. itemin synkkaus onnistui", 200, response.getStatus());
        List<Integer> responseBody = response.readEntity(new GenericType<List<Integer>>() {});
        Assert.assertArrayEquals(
            "Pitäisi palauttaa onnistuneesti synkattujen itemeiden id:t",
            new Integer[]{queue.get(0).getId()},
            responseBody.toArray(new Integer[1])
        );
    }

    @Test
    public void syncAllSynkkaaJokaisenQueueIteminJaPalauttaaOnnistuneestiSynkattujenItemienIdt() {
        // Luo testidata
        List<SyncQueueItem> testSyncQueue = this.makeTestSyncQueue();
        Map testWorkoutSyncData = (Map) testSyncQueue.get(0).getData();
        Map testWorkoutExerciseSyncData = (Map) testSyncQueue.get(1).getData();
        //
        Response response = this.newPostRequest("sync", testSyncQueue);
        // Testaa että synkkasi jokaisen itemin
        Assert.assertEquals(200, response.getStatus());
        List<Integer> responseBody = response.readEntity(new GenericType<List<Integer>>() {});
        Assert.assertArrayEquals(
            "Pitäisi palauttaa onnistuneesti synkattujen itemeiden id:t",
            new Integer[]{testSyncQueue.get(0).getId(), testSyncQueue.get(1).getId()},
            responseBody.toArray(new Integer[2])
        );
        //
        Workout syncedWorkout = (Workout) utils.selectOneWhere(
            "SELECT id as i, `start` as s FROM workout WHERE id = :id",
            new MapSqlParameterSource().addValue("id", testWorkoutSyncData.get("id")),
            (rs, i) -> {
                Workout w = new Workout(); w.setId(rs.getString("i")); w.setStart(rs.getInt("s")); return w;
            }
        );
        Assert.assertNotNull("Synkattava data pitäisi insertoitua tietokantaan", syncedWorkout);
        Assert.assertEquals("Tietokantaan synkattu treeni pitäisi sisältää sama data kuin inputissa",
            testWorkoutSyncData.get("start"), syncedWorkout.getStart()
        );
        //
        Workout.Exercise syncedWorkoutExercise = (Workout.Exercise) utils.selectOneWhere(
            "SELECT ordinal FROM workoutExercise WHERE id = :id",
            new MapSqlParameterSource().addValue("id", testWorkoutExerciseSyncData.get("id")),
            (rs, i) -> {
                Workout.Exercise we = new Workout.Exercise();
                we.setOrdinal(rs.getInt("ordinal"));
                return we;
            }
        );
        Assert.assertNotNull("Synkattava data pitäisi insertoitua tietokantaan", syncedWorkoutExercise);
        Assert.assertEquals("Tietokantaan synkattu treeniliike pitäisi sisältää sama data kuin inputissa",
            testWorkoutExerciseSyncData.get("ordinal"), syncedWorkoutExercise.getOrdinal()
        );
    }

    @Test
    public void syncAllSisällyttääPyynnönAuhtorizationHeaderinSynkkauspyyntöön() {
        List<SyncQueueItem> testQueue = new ArrayList<>();
        SyncQueueItem testItem = new SyncQueueItem();
        testItem.setId(3);
        testItem.setData(TestData.getSomeJunkData());
        testItem.setRoute(new Route("test", "PUT"));
        testQueue.add(testItem);
        //
        Response response = this.newPostRequest("sync", testQueue, requestBuilder ->
            requestBuilder.header(AuthenticationFilter.AUTH_HEADER_NAME, TestData.MOCK_AUTH_HEADER)
        );
        Assert.assertEquals(200, response.getStatus());
        //
        Assert.assertEquals("Pitäisi sisällyttää Authorization-header synkkauspyyntöihin",
            TestData.MOCK_AUTH_HEADER, TestController.receivedAuthHeaderValue
        );
        response.close();
    }

    private List<SyncQueueItem> makeTestSyncQueue() {
        SyncQueueItem testWorkoutSyncItem = new SyncQueueItem();
        testWorkoutSyncItem.setId(2);
        testWorkoutSyncItem.setRoute(TestData.workoutInsertRoute);
        testWorkoutSyncItem.setData(TestData.getSomeWorkoutData());
        //
        SyncQueueItem testWorkoutExerciseSyncItem = new SyncQueueItem();
        testWorkoutExerciseSyncItem.setId(3);
        testWorkoutExerciseSyncItem.setRoute(TestData.workoutExerciseAddRoute);
        testWorkoutExerciseSyncItem.setData(TestData.getSomeWorkoutExerciseData(testWorkoutSyncItem.getData(), testExercise));
        //
        List<SyncQueueItem> testSyncQueue = new ArrayList<>();
        testSyncQueue.add(testWorkoutSyncItem);
        testSyncQueue.add(testWorkoutExerciseSyncItem);
        return testSyncQueue;
    }

    private List<SyncQueueItem> makeSyncQueueWithCoupleOfItems() {
        SyncQueueItem testWorkoutSyncItem1 = new SyncQueueItem();
        testWorkoutSyncItem1.setId(1);
        testWorkoutSyncItem1.setRoute(TestData.workoutInsertRoute);
        //
        SyncQueueItem testWorkoutSyncItem2 = new SyncQueueItem();
        testWorkoutSyncItem2.setId(2);
        testWorkoutSyncItem2.setRoute(new Route("workout/foo", "DELETE"));
        //
        List<SyncQueueItem> queue = new ArrayList<>();
        queue.add(testWorkoutSyncItem1);
        queue.add(testWorkoutSyncItem2);
        return queue;
    }

    private List<SyncQueueItem> makeSyncQueueWithBogusData() {
        SyncQueueItem workoutSyncItemWithBogusData = new SyncQueueItem();
        workoutSyncItemWithBogusData.setId(1);
        workoutSyncItemWithBogusData.setRoute(TestData.workoutInsertRoute);
        workoutSyncItemWithBogusData.setData(TestData.getBogusWorkoutData());
        //
        List<SyncQueueItem> queue = new ArrayList<>();
        queue.add(workoutSyncItemWithBogusData);
        return queue;
    }
}
