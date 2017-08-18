package net.mdh.enj.stat;

import net.mdh.enj.workout.WorkoutControllerTestCase;
import net.mdh.enj.workout.Workout;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.List;
import org.junit.Assert;
import org.junit.Test;

public class StatControllerTest extends WorkoutControllerTestCase {

    @Test
    public void GETBestSetsEiPalautaTreenilleParhaitaSarjojaJosNiitäEiOle() {
        List<BestSetMapper.BestSet> sets = this.fetchBestSets();
        Assert.assertFalse(sets.stream().anyMatch(s -> s.getExerciseName().equals(testExercise.getName())));
    }

    /**
     * Testailee, että "GET /api/stat/best-sets"-reitti palauttaa aina uusimmat
     * ennätykset.
     */
    @Test
    public void GETBestSetsSisältääTreeninParhaatSarjat() {
        Workout.Exercise we = new Workout.Exercise();
        we.setWorkoutId(testWorkout.getId());
        we.setExerciseId(testExercise.getId());
        utils.insertWorkoutExercise(we);
        // Insertoi ennätys #1 -------------------------------------------------
        Workout.Exercise.Set set1 = new Workout.Exercise.Set();
        set1.setWeight(5);
        set1.setReps(2);
        set1.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set1);
        // Assertoi, että palauttaa parhaimman
        BestSetMapper.BestSet result1 = this.fetchBestSets().stream()
            .filter(bs -> bs.getExerciseName().equals(testExercise.getName())).findFirst().orElse(null);
        Assert.assertNotNull("Pitäsi sisältää ennätyksiä testiliikkeelle", result1);
        Assert.assertEquals(String.valueOf(set1.getWeight()), String.valueOf(result1.getStartWeight()));
        Assert.assertEquals(String.valueOf(set1.getWeight()), String.valueOf(result1.getBestWeight()));
        Assert.assertEquals(set1.getReps(), result1.getBestWeightReps());
        Assert.assertEquals(0, result1.getTimesImproved());
        // Lisää ennätys #2 ----------------------------------------------------
        Workout.Exercise.Set set2 = new Workout.Exercise.Set();
        set2.setWeight(6);
        set2.setReps(3);
        set2.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set2);
        // Assertoi, että yliajoi edellisen ennätyksen
        BestSetMapper.BestSet result2 = this.fetchBestSets().stream()
            .filter(bs -> bs.getExerciseName().equals(testExercise.getName())).findFirst().orElse(null);
        Assert.assertNotNull("Pitäsi sisältää ennätyksiä testiliikkeelle", result2);
        Assert.assertNotEquals("Pitäsi korvata edellinen ennätys uudella", result1.toString(), result2.toString());
        Assert.assertEquals(String.valueOf(set1.getWeight()), String.valueOf(result2.getStartWeight()));
        Assert.assertEquals(String.valueOf(set2.getWeight()), String.valueOf(result2.getBestWeight()));
        Assert.assertEquals(set2.getReps(), result2.getBestWeightReps());
        Assert.assertEquals(1, result2.getTimesImproved());
        // Lisää ei-ennätys/normaali sarja -------------------------------------
        Workout.Exercise.Set set3 = new Workout.Exercise.Set();
        set3.setWeight(set2.getWeight());
        set3.setReps(set2.getReps());
        set3.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set3);
        // Assertoi, ettei muuttanut mitään, koska tulos ei parantunut
        BestSetMapper.BestSet result3 = this.fetchBestSets().stream()
            .filter(bs -> bs.getExerciseName().equals(testExercise.getName())).findFirst().orElse(null);
        Assert.assertNotNull("Pitäsi sisältää ennätyksiä testiliikkeelle", result3);
        Assert.assertEquals("Ei pitäsi korvata edellistä ennätystä", result2.toString(), result3.toString());
    }

    private List<BestSetMapper.BestSet> fetchBestSets() {
        Response response = target("stat/best-sets").request().get();
        Assert.assertEquals(200, response.getStatus());
        return response.readEntity(new GenericType<List<BestSetMapper.BestSet>>() {});
    }
}
