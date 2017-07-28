package net.mdh.enj.sync;

import net.mdh.enj.HttpClient;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.auth.AuthenticationFilter;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.TestController;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import net.mdh.enj.workout.Workout;
import net.mdh.enj.workout.WorkoutController;
import net.mdh.enj.workout.WorkoutRepository;
import net.mdh.enj.workout.WorkoutExerciseRepository;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.glassfish.jersey.server.validation.ValidationError;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import org.junit.BeforeClass;
import org.junit.Assert;
import org.junit.Test;

public class SyncingTest extends RollbackingDBJerseyTest {

    private static DbTestUtils utils;
    private static SyncRouteRegister syncRouteRegister;
    private static Exercise testExercise;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDataSource);
        testExercise = new Exercise();
        testExercise.setName("exs");
        utils.insertExercise(testExercise);
        // Täytä SyncRouteRegister manuaalisesti, jonka net.mdh.enj.SyncRouteCollector
        // normaalisti suorittaa
        manuallyPopulateSyncRouteRegister();
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(SyncController.class)
            .register(TestController.class)
            // Kontrollerit, joiden dataa synkataan testeissä.
            .register(WorkoutController.class)
            // tänne lisää...
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(syncRouteRegister).to(SyncRouteRegister.class);
                    bind(SyncingTest.this).to(HttpClient.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    // WorkoutController riippuvuudet
                    bind(WorkoutRepository.class).to(WorkoutRepository.class);
                    bind(WorkoutExerciseRepository.class).to(WorkoutExerciseRepository.class);
                }
            });
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
        queue.get(1).setData(TestData.getBogusWorkoutData());
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
    public void syncAllSynkkaaJokaisenQueueIteminJaPalauttaaOnnistuneestiSynkattujenItemienTempIdt() {
        // Luo testidata
        List<SyncQueueItem> testSyncQueue = this.makeTestSyncQueue();
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
        Workout syncedWorkout = (Workout) utils.selectOne(
            "SELECT id as i, `start` as s FROM workout ORDER BY `start` DESC LIMIT 1", (rs, i) -> {
                Workout w = new Workout(); w.setId(rs.getString("i")); w.setStart(rs.getInt("s")); return w;
            }
        );
        Assert.assertNotNull("Synkattu data pitäisi olla insertoituna tietokantaan", syncedWorkout);
        Assert.assertEquals("Tietokantaan synkattu treeni pitäisi sisältää sama data kuin inputissa",
            testSyncQueue.get(0).getData().get("start"), syncedWorkout.getStart()
        );
        //
        Workout.Exercise syncedWorkoutExercise = (Workout.Exercise) utils.selectOneWhere(
            "SELECT orderDef as od FROM workoutExercise WHERE workoutId = :id",
            new MapSqlParameterSource().addValue("id", syncedWorkout.getId()),
            (rs, i) -> {
                Workout.Exercise w = new Workout.Exercise();
                w.setOrderDef(rs.getInt("od"));
                return w;
            }
        );
        Assert.assertNotNull("Synkattu data pitäisi olla insertoituna tietokantaan", syncedWorkoutExercise);
        Assert.assertEquals("Tietokantaan synkattu treeni pitäisi sisältää sama data kuin inputissa",
            testSyncQueue.get(1).getData().get("orderDef"), syncedWorkoutExercise.getOrderDef()
        );
    }

    @Test
    public void syncAllSisällyttääPyynnönAuhtorizationHeaderinSynkkauspyyntöön() {
        SyncRoute testRoute = new SyncRoute("test", "PUT");
        syncRouteRegister.add(testRoute);
        List<SyncQueueItem> testQueue = new ArrayList<>();
        SyncQueueItem testItem = new SyncQueueItem();
        testItem.setId(3);
        testItem.setData(TestData.getSomeJunkData());
        testItem.setRoute(testRoute);
        testQueue.add(testItem);
        //
        Response response = this.newPostRequest("sync", testQueue, requestBuilder ->
            requestBuilder.header(AuthenticationFilter.AUTH_HEADER_NAME, TestData.MOCK_AUTH_HEADER)
        );
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
        testWorkoutSyncItem2.setId(1);
        testWorkoutSyncItem2.setRoute(TestData.workoutInsertRoute);
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

    private static void manuallyPopulateSyncRouteRegister() {
        SyncRoute registeredWorkoutInsertRoute = new SyncRoute();
        registeredWorkoutInsertRoute.setUrl(TestData.workoutInsertRoute.getUrl());
        registeredWorkoutInsertRoute.setMethod(TestData.workoutInsertRoute.getMethod());
        SyncRoute registeredWorkoutExerciseAddRoute = new SyncRoute();
        registeredWorkoutExerciseAddRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl());
        registeredWorkoutExerciseAddRoute.setMethod(TestData.workoutExerciseAddRoute.getMethod());
        syncRouteRegister = new SyncRouteRegister();
        syncRouteRegister.add(registeredWorkoutInsertRoute);
        syncRouteRegister.add(registeredWorkoutExerciseAddRoute);
    }
}
