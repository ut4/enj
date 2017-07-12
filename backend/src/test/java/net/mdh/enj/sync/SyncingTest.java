package net.mdh.enj.sync;

import net.mdh.enj.HttpClient;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import net.mdh.enj.workout.SyncDataPreparers;
import net.mdh.enj.workout.Workout;
import net.mdh.enj.workout.WorkoutController;
import net.mdh.enj.workout.WorkoutExerciseRepository;
import net.mdh.enj.workout.WorkoutRepository;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.validation.ValidationError;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        List<ValidationError> errors = response.readEntity(new GenericType<List<ValidationError>>() {});
        Assert.assertEquals("WorkoutController.insert.arg0.start", errors.get(0).getPath());
    }

    @Test
    public void syncAllPalauttaaOnnistuneestiSynkattujenItemeidenIdtFailauksestaHuolimatta() {
        // Simuloi tilanne, jossa synkkaujonon toinen itemi failaa
        List<SyncQueueItem> queue = this.makeSyncQueueWithCoupleOfItems();
        queue.get(0).setData(this.makeTestWorkoutData());
        queue.get(1).setData(this.makeBogusWorkoutData());
        Response response = this.newPostRequest("sync", queue);
        // Assertoi että ei repinyt pelihousujansa, vaan palautti onnistuneesti synkattujen itemeiden id:t
        if (response.getStatus() != 200) {
            System.out.println(response.readEntity(String.class));
        }
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
            "SELECT id as i, `start` as s FROM workout ORDER BY id DESC LIMIT 1", (rs, i) -> {
                Workout w = new Workout(); w.setId(rs.getInt("i")); w.setStart(rs.getInt("s")); return w;
            }
        );
        Assert.assertNotNull("Synkattu data pitäisi olla insertoituna tietokantaan", syncedWorkout);
        Assert.assertEquals("Tietokantaan synkattu treeni pitäisi sisältää sama data kuin inputissa",
            testSyncQueue.get(0).getData().get("start"), syncedWorkout.getStart()
        );
        //
        Workout.Exercise syncedWorkoutExercise = (Workout.Exercise) utils.selectOneWhere(
            "SELECT orderDef as od FROM workoutExercise WHERE workoutId = ?",
            new Object[]{syncedWorkout.getId()},
            (rs, i) -> {
                Workout.Exercise w = new Workout.Exercise(); w.setOrderDef(rs.getInt("od")); return w;
            }
        );
        Assert.assertNotNull("Synkattu data pitäisi olla insertoituna tietokantaan", syncedWorkoutExercise);
        Assert.assertEquals("Tietokantaan synkattu treeni pitäisi sisältää sama data kuin inputissa",
            testSyncQueue.get(1).getData().get("orderDef"), syncedWorkoutExercise.getOrderDef()
        );
        syncRouteRegister.clear();
    }

    private List<SyncQueueItem> makeTestSyncQueue() {
        SyncQueueItem testWorkoutSyncItem = new SyncQueueItem();
        testWorkoutSyncItem.setId(2); // frontendin generoima väliaikainen id
        testWorkoutSyncItem.setRouteName(SyncRouteName.WORKOUT_INSERT.toString());
        testWorkoutSyncItem.setData(this.makeTestWorkoutData());
        //
        SyncQueueItem testWorkoutExerciseSyncItem = new SyncQueueItem();
        testWorkoutExerciseSyncItem.setId(3); // frontendin generoima väliaikainen id
        testWorkoutExerciseSyncItem.setRouteName(SyncRouteName.WORKOUT_EXERCISE_ADD.toString());
        testWorkoutExerciseSyncItem.setData(this.makeTestWorkoutExerciseData(testWorkoutSyncItem.getData()));
        //
        List<SyncQueueItem> testSyncQueue = new ArrayList<>();
        testSyncQueue.add(testWorkoutSyncItem);
        testSyncQueue.add(testWorkoutExerciseSyncItem);
        return testSyncQueue;
    }

    private List<SyncQueueItem> makeSyncQueueWithCoupleOfItems() {
        SyncQueueItem testWorkoutSyncItem1 = new SyncQueueItem();
        testWorkoutSyncItem1.setId(1);
        testWorkoutSyncItem1.setRouteName(SyncRouteName.WORKOUT_INSERT.toString());
        //
        SyncQueueItem testWorkoutSyncItem2 = new SyncQueueItem();
        testWorkoutSyncItem2.setId(1);
        testWorkoutSyncItem2.setRouteName(SyncRouteName.WORKOUT_INSERT.toString());
        //
        List<SyncQueueItem> queue = new ArrayList<>();
        queue.add(testWorkoutSyncItem1);
        queue.add(testWorkoutSyncItem2);
        return queue;
    }

    private HashMap<String, Object> makeTestWorkoutData() {
        HashMap<String, Object> data = new HashMap<>();
        data.put("id", 4); // frontendin generoima väliaikainen id
        data.put("start", 101L);
        return data;
    }

    private List<SyncQueueItem> makeSyncQueueWithBogusData() {
        SyncQueueItem workoutSyncItemWithBogusData = new SyncQueueItem();
        workoutSyncItemWithBogusData.setId(1);
        workoutSyncItemWithBogusData.setRouteName(SyncRouteName.WORKOUT_INSERT.toString());
        workoutSyncItemWithBogusData.setData(this.makeBogusWorkoutData());
        //
        List<SyncQueueItem> queue = new ArrayList<>();
        queue.add(workoutSyncItemWithBogusData);
        return queue;
    }

    private Map<String,Object> makeBogusWorkoutData() {
        HashMap<String, Object> data = new HashMap<>();
        data.put("id", 0);
        return data;
    }

    private Map<String,Object> makeTestWorkoutExerciseData(Map<String, Object> parentWorkoutData) {
        HashMap<String, Object> data = new HashMap<>();
        data.put("id", 5); // frontendin generoima väliaikainen id
        data.put("orderDef", 102);
        data.put("exercise", testExercise);
        data.put("workoutId", parentWorkoutData.get("id"));
        return data;
    }

    private static void manuallyPopulateSyncRouteRegister() {
        SyncRoute registeredWorkoutInsertRoute = new SyncRoute();
        registeredWorkoutInsertRoute.setName(SyncRouteName.WORKOUT_INSERT);
        registeredWorkoutInsertRoute.setUrl("workout");
        registeredWorkoutInsertRoute.setMethod("POST");
        SyncRoute registeredWorkoutExerciseAddRoute = new SyncRoute();
        registeredWorkoutExerciseAddRoute.setName(SyncRouteName.WORKOUT_EXERCISE_ADD);
        registeredWorkoutExerciseAddRoute.setUrl("workout/exercise");
        registeredWorkoutExerciseAddRoute.setMethod("POST");
        registeredWorkoutExerciseAddRoute.setPreparerClass(SyncDataPreparers.WorkoutExerciseInsertPreparer.class);
        syncRouteRegister = new SyncRouteRegister();
        syncRouteRegister.add(registeredWorkoutInsertRoute);
        syncRouteRegister.add(registeredWorkoutExerciseAddRoute);
    }
}
