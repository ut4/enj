package net.mdh.enj.workout;

import net.mdh.enj.resources.TestData;
import net.mdh.enj.sync.SyncQueueItem;
import net.mdh.enj.sync.Route;
import java.util.ArrayList;
import java.util.List;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class WorkoutExerciseAddPreparerTest {

    private final Integer frontendGeneratedParentWorkoutId = 46;
    private final Integer mariaDBGeneratedParentWorkoutId = 2;
    private SyncQueueItem someAlreadySyncedUnrelatedWorkout;
    private SyncQueueItem someAlreadySyncedUnrelatedItem;
    private SyncQueueItem someAlreadySyncedParentWorkout;
    private SyncDataPreparers.WorkoutExerciseInsertPreparer p;

    @Before
    public void beforeEach() {
        this.someAlreadySyncedUnrelatedWorkout = new SyncQueueItem();
        this.someAlreadySyncedUnrelatedWorkout.setRoute(TestData.workoutInsertRoute);
        this.someAlreadySyncedUnrelatedWorkout.setData(TestData.getSomeWorkoutData(45, 5L));
        this.someAlreadySyncedUnrelatedItem = new SyncQueueItem();
        this.someAlreadySyncedUnrelatedItem.setRoute(new Route("foo", "PUT"));
        this.someAlreadySyncedUnrelatedItem.setData(TestData.getSomeWorkoutData(this.frontendGeneratedParentWorkoutId, 6L));
        this.someAlreadySyncedUnrelatedItem.setSyncResult(this.mariaDBGeneratedParentWorkoutId - 1);
        this.someAlreadySyncedParentWorkout = new SyncQueueItem();
        this.someAlreadySyncedParentWorkout.setRoute(TestData.workoutInsertRoute);
        this.someAlreadySyncedParentWorkout.setData(TestData.getSomeWorkoutData(this.frontendGeneratedParentWorkoutId, 6L));
        this.someAlreadySyncedParentWorkout.setSyncResult(this.mariaDBGeneratedParentWorkoutId);
        this.p = new SyncDataPreparers.WorkoutExerciseInsertPreparer();
    }

    /**
     * Testaa, että WorkoutExerciseAddPreparer.prepareForSync() korvaa synkattavan
     * itemin väliaikaisen, frontendin generoiman data.workoutId-viiteavaimen oikeaksi
     * MariaDB:n generoimaksi id:ksi. Pitäisi etsiä arvon alreadySyncedItems-taulukosta.
     *
     * Esim. jos
     *
     * itemToPrepare = {data:{workoutId: 3,...}}, ja
     * alreadySyncedItems = [
     *     {route:{url:"exercise",method:"POST"},data:...},
     *     {route:{url:"workout",method:"POST"},data:{"id":3,...},syncResult:67},
     *     {route:{url:"workout",method:"PUT"},data:...},
     *     ...
     * ],
     *
     * jossa 3 = frontendin generoima väliaikainen id,
     * ja   67 = MariaDB:n generoima oikea id,
     *
     * niin prepareForSync()-kutsun jälkeen itemToPrepare pitäisi olla mutatoitunut:
     *
     * {data:{workoutId: 67,...}}
     */
    @Test
    public void prepareForSyncEtsiiTreeniliikedataanOikeanTreeniviiteavaimen() throws Exception {
        // Treeniliike-itemi, jonka workoutId viittaa aiemmin synkattuun treeniin
        SyncQueueItem testWorkoutExerciseSyncItem = new SyncQueueItem();
        testWorkoutExerciseSyncItem.setData(TestData.getSomeWorkoutExerciseData(
            this.someAlreadySyncedParentWorkout.getData()
        ));
        //
        this.p.prepareForSync(testWorkoutExerciseSyncItem, this.makeAlreadySyncedItemsList());
        //
        Assert.assertEquals("Pitäisi asettaa viiteavaimen arvoksi aiemmin synkatun parent-treenin syncResult",
            this.mariaDBGeneratedParentWorkoutId,
            testWorkoutExerciseSyncItem.getData().get("workoutId")
        );
    }

    private List<SyncQueueItem> makeAlreadySyncedItemsList() {
        List<SyncQueueItem> mockList = new ArrayList<>();
        mockList.add(this.someAlreadySyncedUnrelatedWorkout);
        mockList.add(this.someAlreadySyncedUnrelatedItem);
        mockList.add(this.someAlreadySyncedParentWorkout);
        return mockList;
    }
}
