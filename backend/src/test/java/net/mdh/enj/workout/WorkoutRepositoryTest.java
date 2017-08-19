package net.mdh.enj.workout;

import org.junit.Test;
import org.junit.Before;
import org.junit.Assert;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.RollbackingDBUnitTest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class WorkoutRepositoryTest extends RollbackingDBUnitTest {

    private DbTestUtils utils;
    private WorkoutRepository workoutRepository;
    private static Exercise testExercise;

    public WorkoutRepositoryTest() {
        super();
        this.utils = new DbTestUtils(rollbackingDataSource);
    }

    @Before
    public void beforeEach() {
        this.workoutRepository = new WorkoutRepository(rollbackingDSFactory);
        if (testExercise == null) {
            testExercise = new Exercise();
            testExercise.setName("foo");
            this.utils.insertExercise(testExercise);
        }
    }

    /**
     * Testaa, että selectAll hakee treenit tietokannasta relaatioineen (mappaa
     * treeniin myös siihen kuuluvat liikkeet (jos niitä on), ja liikkeisiin niihin
     * kuuluvat setit (jos niitä on)).
     */
    @Test
    public void selectAllSisältääLiikkeetJaSetit() {
        Workout w1 = this.insertWorkoutWithExerciseAndSet();
        Workout w2 = this.insertWorkoutWithExerciseButNoSets(this.newTimestamp() + 1);
        Workout w3 = this.insertWorkoutWithoutExercisesOrSets(this.newTimestamp() + 2);
        //
        SearchFilters searchFilters = new SearchFilters();
        searchFilters.setUserId(TestData.TEST_USER_ID);
        List<Workout> results = this.workoutRepository.selectAll(searchFilters);
        Assert.assertEquals(3, results.size());
        Workout actualW1 = results.get(2);
        Workout actualW2 = results.get(1);
        Workout actualW3 = results.get(0);
        //
        Assert.assertEquals(w3.toString(), actualW3.toString());
        Assert.assertEquals(0, actualW3.getExercises().size());
        //
        Assert.assertEquals(w2.toString(), actualW2.toString());
        Assert.assertEquals(1, actualW2.getExercises().size());
        Assert.assertEquals(w2.getExercises().get(0).toString(),
            actualW2.getExercises().get(0).toString()
        );
        Assert.assertEquals(0, actualW2.getExercises().get(0).getSets().size());
        //
        Assert.assertEquals(w1.toString(), actualW1.toString());
        Assert.assertEquals(1, actualW1.getExercises().size());
        Assert.assertEquals(w1.getExercises().get(0).toString(),
            actualW1.getExercises().get(0).toString()
        );
        Assert.assertEquals(1, actualW1.getExercises().get(0).getSets().size());
        Assert.assertEquals(w1.getExercises().get(0).getSets().get(0).toString(),
            actualW1.getExercises().get(0).getSets().get(0).toString()
        );
    }

    private Workout insertWorkoutWithExerciseAndSet() {
        // Treeni
        Workout workout = this.insertWorkout(this.newTimestamp());
        // Treenille 1 liike
        Workout.Exercise we = this.insertWorkoutExercise(workout.getId(), 0);
        this.addExercisesToWorkout(workout, we);
        // Liikkeeelle yksi setti
        Workout.Exercise.Set wes = this.insertWorkoutExercseSet(we.getId());
        this.addSetsToWorkoutExercise(we, wes);
        return workout;
    }

    private Workout insertWorkoutWithExerciseButNoSets(long timestamp) {
        // Treeni
        Workout workout = this.insertWorkout(timestamp);
        // Treenille 1 liike
        Workout.Exercise we = this.insertWorkoutExercise(workout.getId(), 1);
        this.addExercisesToWorkout(workout, we);
        return workout;
    }

    private Workout insertWorkoutWithoutExercisesOrSets(long timestamp) {
        return this.insertWorkout(timestamp);
    }

    private Workout insertWorkout(long timestamp) {
        Workout workout = new Workout();
        workout.setUserId(TestData.TEST_USER_ID);
        workout.setStart(timestamp);
        this.utils.insertWorkout(workout);
        return workout;
    }

    private Workout.Exercise insertWorkoutExercise(String workoutId, int ordinal) {
        Workout.Exercise we = new Workout.Exercise();
        we.setOrdinal(ordinal);
        we.setWorkoutId(workoutId);
        we.setExerciseId(WorkoutRepositoryTest.testExercise.getId());
        we.setExerciseName(WorkoutRepositoryTest.testExercise.getName());
        this.utils.insertWorkoutExercise(we);
        return we;
    }

    private void addExercisesToWorkout(Workout workout, Workout.Exercise... esx) {
        List<Workout.Exercise> wexs = new ArrayList<>();
        Collections.addAll(wexs, esx);
        workout.setExercises(wexs);
    }

    private Workout.Exercise.Set insertWorkoutExercseSet(String workoutExerciseId) {
        Workout.Exercise.Set wes = new Workout.Exercise.Set();
        wes.setWeight(100);
        wes.setReps(6);
        wes.setOrdinal(2);
        wes.setWorkoutExerciseId(workoutExerciseId);
        this.utils.insertWorkoutExerciseSet(wes);
        return  wes;
    }

    private void addSetsToWorkoutExercise(Workout.Exercise we, Workout.Exercise.Set... wes) {
        List<Workout.Exercise.Set> weSets = new ArrayList<>();
        Collections.addAll(weSets, wes);
        we.setSets(weSets);
    }

    private long newTimestamp() {
        return System.currentTimeMillis() / 1000L;
    }
}
