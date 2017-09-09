package net.mdh.enj.stat;

import net.mdh.enj.workout.Workout;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.workout.WorkoutControllerTestCase;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.GenericType;
import java.util.function.Predicate;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.Arrays;
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
        Workout.Exercise we = this.insertWorkoutExercise(null);
        // Insertoi ennätys #1 (laskettu 1RM 92) -------------------------------
        Workout.Exercise.Set set1 = new Workout.Exercise.Set();
        set1.setWeight(80);
        set1.setReps(6);
        set1.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set1);
        // Assertoi, että palauttaa parhaimman
        BestSetMapper.BestSet result1 = this.findBestSetByExerciseName(
            this.fetchBestSets(),
            testExercise.getName()
        );
        Assert.assertNotNull("Pitäsi sisältää ennätyksiä testiliikkeelle", result1);
        Assert.assertEquals(String.valueOf(set1.getWeight()), String.valueOf(result1.getStartWeight()));
        Assert.assertEquals(String.valueOf(set1.getWeight()), String.valueOf(result1.getBestWeight()));
        Assert.assertEquals(set1.getReps(), result1.getBestWeightReps());
        Assert.assertEquals(0, result1.getTimesImproved());
        // Lisää ennätys #2 (laskettu 1RM 94) ----------------------------------
        Workout.Exercise.Set set2 = new Workout.Exercise.Set();
        set2.setWeight(80);
        set2.setReps(7);
        set2.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set2);
        // Assertoi, että yliajoi edellisen ennätyksen
        BestSetMapper.BestSet result2 = this.findBestSetByExerciseName(
            this.fetchBestSets(),
            testExercise.getName()
        );;
        Assert.assertNotNull("Pitäsi sisältää ennätyksiä testiliikkeelle", result2);
        Assert.assertNotEquals("Pitäsi korvata edellinen ennätys uudella", result1.toString(), result2.toString());
        Assert.assertEquals(String.valueOf(set1.getWeight()), String.valueOf(result2.getStartWeight()));
        Assert.assertEquals(String.valueOf(set2.getWeight()), String.valueOf(result2.getBestWeight()));
        Assert.assertEquals(set2.getReps(), result2.getBestWeightReps());
        Assert.assertEquals(1, result2.getTimesImproved());
        // Lisää ei-ennätys -sarja ---------------------------------------------
        Workout.Exercise.Set set3 = new Workout.Exercise.Set();
        set3.setWeight(93);
        set3.setReps(1);
        set3.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set3);
        // Assertoi, ettei muuttanut mitään, koska tulos ei parantunut
        BestSetMapper.BestSet result3 = this.findBestSetByExerciseName(
            this.fetchBestSets(),
            testExercise.getName()
        );;
        Assert.assertNotNull("Pitäsi sisältää ennätyksiä testiliikkeelle", result3);
        Assert.assertEquals("Ei pitäsi korvata edellistä ennätystä", result2.toString(), result3.toString());
    }

    @Test
    public void GETBestSetsPalauttaaVainKirjautuneenKäyttäjänEnnätyksetTimesImprovedJärjestyksessä() {
        Workout w = new Workout();
        w.setUserId(TestData.TEST_USER_ID2);
        w.setStart(System.currentTimeMillis() / 1000L);
        utils.insertWorkout(w);
        Workout.Exercise we = this.insertWorkoutExercise(w.getId());
        //
        Workout.Exercise.Set otherUsersBestSet = new Workout.Exercise.Set();
        otherUsersBestSet.setWeight(60);
        otherUsersBestSet.setReps(5);
        otherUsersBestSet.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(otherUsersBestSet);
        //
        List<BestSetMapper.BestSet> bestSets = this.fetchBestSets();
        Assert.assertNull("Ei pitäisi sisältää toisen käyttäjän ennätyksiä",
            this.findBestSet(bestSets, bs -> bs.getWorkoutExerciseSetId().equals(otherUsersBestSet.getId()))
        );
        List<BestSetMapper.BestSet> sorted = new ArrayList<>(bestSets);
        sorted.sort(Comparator.comparingInt(BestSetMapper.BestSet::getTimesImproved).reversed());
        Assert.assertEquals("Pitäisi järjestää ennätykset timesImproved:n mukaan laskevasti",
            this.getImprovementCounts(bestSets), this.getImprovementCounts(sorted)
        );
    }

    private List<BestSetMapper.BestSet> fetchBestSets() {
        Response response = target("stat/best-sets").request().get();
        Assert.assertEquals(200, response.getStatus());
        return response.readEntity(new GenericType<List<BestSetMapper.BestSet>>() {});
    }

    private BestSetMapper.BestSet findBestSetByExerciseName(
        List<BestSetMapper.BestSet> bestSets,
        String exerciseName
    ) {
        return this.findBestSet(bestSets, bs -> bs.getExerciseName().equals(exerciseName));
    }

    private BestSetMapper.BestSet findBestSet(
        List<BestSetMapper.BestSet> bestSets,
        Predicate<BestSetMapper.BestSet> predicate
    ) {
        return bestSets.stream().filter(predicate).findFirst().orElse(null);
    }

    private Workout.Exercise insertWorkoutExercise(String workoutId) {
        Workout.Exercise we = new Workout.Exercise();
        we.setWorkoutId(workoutId == null ? testWorkout.getId() : workoutId);
        we.setExerciseId(testExercise.getId());
        utils.insertWorkoutExercise(we);
        return we;
    }

    private String getImprovementCounts(List<BestSetMapper.BestSet> bestSets) {
        return Arrays.toString(bestSets.stream().mapToInt(BestSetMapper.BestSet::getTimesImproved).toArray());
    }
}
