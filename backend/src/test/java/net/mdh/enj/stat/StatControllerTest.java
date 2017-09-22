package net.mdh.enj.stat;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import net.mdh.enj.workout.WorkoutControllerTestCase;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.workout.Workout;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.function.Predicate;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

public class StatControllerTest extends WorkoutControllerTestCase {

    @Before
    public void beforeEach() {
        utils.delete(
            "DELETE bestSet FROM bestSet" +
            " JOIN workoutExerciseSet wes ON (wes.id = bestSet.workoutExerciseSetId)" +
            " JOIN workoutExercise we ON (we.id = wes.workoutExerciseId)" +
            " WHERE we.exerciseId = :exerciseId",
            new MapSqlParameterSource("exerciseId", testExercise.getId())
        );
    }

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
        Workout.Exercise we = this.insertWorkoutExercise(testWorkout.getId());
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

    @Test
    public void GETProgressPalauttaaLiikkeenTuloksetValitullaTaiOletuskaavallaLaskettuna() {
        Workout.Exercise we = this.insertWorkoutExercise(testWorkout.getId());
        // Ennätys #1
        Workout.Exercise.Set set1 = new Workout.Exercise.Set();
        set1.setWeight(60);
        set1.setReps(8);
        set1.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set1);
        // Ennätys #2 samaan treeniin
        Workout.Exercise.Set set2 = new Workout.Exercise.Set();
        set2.setWeight(65);
        set2.setReps(8);
        set2.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set2);
        // Oletuskaava (O'connor et al.)
        List<ProgressSetMapper.ProgressSet> progressSets = this.assertContainsProgressSets(
            newGetRequest("stat/progress", t -> t.queryParam("exerciseId", testExercise.getId())),
            set2.getWeight() * (set2.getReps() / 40.0 + 1),
            set1.getWeight() * (set1.getReps() / 40.0 + 1)
        );
        Assert.assertEquals(String.valueOf(set2.getWeight()), String.valueOf(progressSets.get(0).getWeight()));
        Assert.assertEquals(set2.getReps(), progressSets.get(0).getReps());
        Assert.assertNotNull(progressSets.get(0).getLiftedAt());
        Assert.assertEquals(testExercise.getName(), progressSets.get(0).getExerciseName());
        // Parametriin määritelty kaava (total-lifted)
        this.assertContainsProgressSets(
            newGetRequest("stat/progress", t ->
                t.queryParam("exerciseId", testExercise.getId())
                    .queryParam("formula", StatRepository.FORMULA_TOTAL_LIFTED)
            ),
            set2.getWeight() * set2.getReps(),
            set1.getWeight() * set1.getReps()
        );
    }

    @Test
    public void GETProgressPalauttaaEnnenTimetampiaTaiSenJälkeenSuoritetutSarjat() {
        // Eilisen treenissä syntyy ensimmäinen ennätys
        Workout yesterdaysTestWorkout = new Workout();
        yesterdaysTestWorkout.setStart(System.currentTimeMillis() / 1000L - 86400);
        yesterdaysTestWorkout.setUserId(TestData.TEST_USER_ID);
        yesterdaysTestWorkout.setExercises(new ArrayList<>());
        utils.insertWorkout(yesterdaysTestWorkout);
        Workout.Exercise we = this.insertWorkoutExercise(yesterdaysTestWorkout.getId());
        Workout.Exercise.Set set = new Workout.Exercise.Set();
        set.setWeight(60);
        set.setReps(7);
        set.setWorkoutExerciseId(we.getId());
        utils.insertWorkoutExerciseSet(set);
        // ... tämän päivän treenissä toinen
        Workout.Exercise we2 = this.insertWorkoutExercise(testWorkout.getId());
        Workout.Exercise.Set set2 = new Workout.Exercise.Set();
        set2.setWeight(60);
        set2.setReps(8);
        set2.setWorkoutExerciseId(we2.getId());
        utils.insertWorkoutExerciseSet(set2);
        // Hakeeko vain nykyistä treeniä edellisen treenin?
        Response response = newGetRequest("stat/progress", t ->
            t.queryParam("exerciseId", testExercise.getId())
                .queryParam("before", testWorkout.getStart())
        );
        Assert.assertEquals(200, response.getStatus());
        List<ProgressSetMapper.ProgressSet> progressSets = response.readEntity(
            new GenericType<List<ProgressSetMapper.ProgressSet>>(){}
        );
        Assert.assertEquals(1, progressSets.size());
        Assert.assertEquals(set.getReps(), progressSets.get(0).getReps());
        // Hakeeko vain nykyisen treenin?
        Response response2 = newGetRequest("stat/progress", t ->
            t.queryParam("exerciseId", testExercise.getId())
                .queryParam("after", yesterdaysTestWorkout.getStart())
        );
        Assert.assertEquals(200, response2.getStatus());
        List<ProgressSetMapper.ProgressSet> progressSets2 = response2.readEntity(
            new GenericType<List<ProgressSetMapper.ProgressSet>>(){}
        );
        Assert.assertEquals(1, progressSets2.size());
        Assert.assertEquals(set2.getReps(), progressSets2.get(0).getReps());
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
        we.setWorkoutId(workoutId);
        we.setExerciseId(testExercise.getId());
        utils.insertWorkoutExercise(we);
        return we;
    }

    private String getImprovementCounts(List<BestSetMapper.BestSet> bestSets) {
        return Arrays.toString(bestSets.stream().mapToInt(BestSetMapper.BestSet::getTimesImproved).toArray());
    }

    private List<ProgressSetMapper.ProgressSet> assertContainsProgressSets(
        Response progressResponse,
        Double expectedCalculatedValue1,
        Double expectedCalculatedValue2
    ) {
        List<ProgressSetMapper.ProgressSet> progressSets = progressResponse.readEntity(
            new GenericType<List<ProgressSetMapper.ProgressSet>>(){}
        );
        progressSets.sort(Comparator.comparingDouble(ProgressSetMapper.ProgressSet::getWeight).reversed());
        Assert.assertEquals(2, progressSets.size());
        Assert.assertEquals(
            String.valueOf(expectedCalculatedValue1),
            String.valueOf(progressSets.get(0).getCalculatedResult())
        );
        Assert.assertEquals(
            String.valueOf(expectedCalculatedValue2),
            String.valueOf(progressSets.get(1).getCalculatedResult())
        );
        return progressSets;
    }
}
