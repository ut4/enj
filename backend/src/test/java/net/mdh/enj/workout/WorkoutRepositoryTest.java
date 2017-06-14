package net.mdh.enj.workout;

import org.junit.Test;
import org.junit.Before;
import org.junit.Assert;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.RollbackingDBUnitTest;
import net.mdh.enj.resources.DbTestUtils;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class WorkoutRepositoryTest extends RollbackingDBUnitTest {

    private DbTestUtils utils;
    private WorkoutRepository workoutRepository;
    private static Exercise testExercise;

    public WorkoutRepositoryTest() {
        super();
        this.utils = new DbTestUtils(this.rollbackingDataSource);
    }

    @Before
    public void beforeEach() {
        this.workoutRepository = new WorkoutRepository(this.rollbackingDSFactory);
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
        Workout w1 = this.insertWorkoutWithExerciseAndSets();
        Workout w2 = this.insertWorkoutWithExerciseButNoSets();
        Workout w3 = this.insertWorkoutWithoutExercisesOrSets();
        //
        List<Workout> results = this.workoutRepository.selectAll();
        //
        Assert.assertEquals(w3.toString(), results.get(0).toString());
        Assert.assertEquals(null, w3.getExercises());
        //
        Assert.assertEquals(w2.toString(), results.get(1).toString());
        Assert.assertEquals(1, w2.getExercises().size());
        Assert.assertEquals(null, w2.getExercises().get(0).getSets());
        //
        Assert.assertEquals(w1.toString(), results.get(2).toString());
        Assert.assertEquals(1, w1.getExercises().size());
        Assert.assertEquals(1, w1.getExercises().get(0).getSets().size());
    }

    private Workout insertWorkoutWithExerciseAndSets() {
        // Treeni
        Workout workout = this.insertWorkout();
        // Treenille 1 liike
        Workout.Exercise we = this.insertWorkoutExercise(workout.getId());
        this.addExercisesToWorkout(workout, we);
        // Liikkeeelle yksi setti
        Workout.Exercise.Set wes = this.insertWorkoutExercseSet(we.getId());
        this.utils.insertWorkoutExerciseSet(wes);
        this.addSetsToWorkoutExercise(we, wes);
        return workout;
    }

    private Workout insertWorkoutWithExerciseButNoSets() {
        // Treeni
        Workout workout = this.insertWorkout();
        // Treenille 1 liike
        Workout.Exercise we = this.insertWorkoutExercise(workout.getId());
        this.addExercisesToWorkout(workout, we);
        return workout;
    }

    private Workout insertWorkoutWithoutExercisesOrSets() {
        return this.insertWorkout();
    }

    private Workout insertWorkout() {
        Workout workout = new Workout();
        workout.setStart(System.currentTimeMillis() / 1000L);
        this.utils.insertWorkout(workout);
        return workout;
    }

    private Workout.Exercise insertWorkoutExercise(int workoutId) {
        Workout.Exercise we = new Workout.Exercise();
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

    private Workout.Exercise.Set insertWorkoutExercseSet(int workoutExerciseId) {
        Workout.Exercise.Set wes = new Workout.Exercise.Set();
        wes.setWeight(100);
        wes.setReps(6);
        wes.setWorkoutExerciseId(workoutExerciseId);
        this.utils.insertWorkoutExerciseSet(wes);
        return  wes;
    }

    private void addSetsToWorkoutExercise(Workout.Exercise we, Workout.Exercise.Set... wes) {
        List<Workout.Exercise.Set> weSets = new ArrayList<>();
        Collections.addAll(weSets, wes);
        we.setSets(weSets);
    }
}
