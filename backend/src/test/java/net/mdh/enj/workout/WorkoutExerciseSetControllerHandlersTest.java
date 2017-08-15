package net.mdh.enj.workout;

import net.mdh.enj.api.Responses;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.SimpleMappers;
import org.glassfish.jersey.server.validation.ValidationError;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import org.junit.Assert;
import org.junit.Test;
import java.util.ArrayList;
import java.util.List;

/*
 * Testailee kaikki /api/workout/exercise/set -REST-reitit.
 */
public class WorkoutExerciseSetControllerHandlersTest extends WorkoutControllerTestCase {

    @Test
    public void POSTExerciseSetHylkääPyynnönJosDataPuuttuuKokonaan() {
        Response response = this.newPostRequest("workout/exercise/set", null);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insertWorkoutExerciseSet.arg0", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
    }

    @Test
    public void POSTExerciseSetValidoiInputin() {
        Response response = this.newPostRequest("workout/exercise/set", "{}");
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("WorkoutController.insertWorkoutExerciseSet.arg0.reps", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertWorkoutExerciseSet.arg0.workoutExerciseId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void POSTExerciseSetLisääTreeniliikkeelleSetin() {
        // Luo ensin treeniliike, johon setti lisätään
        Workout.Exercise we = this.insertTestWorkoutExercise();
        // Luo testidata
        Workout.Exercise.Set workoutExerciseSet = new Workout.Exercise.Set();
        workoutExerciseSet.setWorkoutExerciseId(we.getId());
        workoutExerciseSet.setWeight(12.5);
        workoutExerciseSet.setReps(10);
        workoutExerciseSet.setOrdinal(1);
        // Lähetä pyyntö
        Response response = this.newPostRequest("workout/exercise/set", workoutExerciseSet);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        workoutExerciseSet.setId(responseBody.insertId);
        // Testaa että insertoitui, ja palautti id:n
        Workout.Exercise.Set inserted = (Workout.Exercise.Set) utils.selectOneWhere(
            "SELECT * FROM workoutExerciseSet WHERE id = :id",
            new MapSqlParameterSource().addValue("id", workoutExerciseSet.getId()),
            new SimpleMappers.WorkoutExerciseSetMapper()
        );
        Assert.assertNotNull("Pitäisi insertoida liikkelle setti", inserted);
        Assert.assertEquals("Pitäisi insertoida POST-datalla", workoutExerciseSet.toString(),
            inserted.toString()
        );
    }

    @Test
    public void POSTExerciseSetAllHylkääPyynnönJosDataPuuttuuKokonaan() {
        // Simuloi POST, jossa ei dataa ollenkaan
        Response response = this.newPostRequest("workout/exercise/set/all", null);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insertAllWorkoutExerciseSets.arg0", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
    }

    @Test
    public void POSTExerciseSetAllValidoiKaikkiInputinSetit() {
        // Simuloi POST, jonka jälkimmäinen bean on virheellinen
        List<Workout.Exercise.Set> input = this.makeCoupleOfWorkoutExerciseSets(TestData.TEST_WORKOUT_EXERCISE_ID);
        input.get(1).setReps(0);
        input.get(1).setWorkoutExerciseId(null);
        Response response = this.newPostRequest("workout/exercise/set/all", input);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("WorkoutController.insertAllWorkoutExerciseSets.arg0[1].reps", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertAllWorkoutExerciseSets.arg0[1].workoutExerciseId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void POSTExerciseSetAllLisääInputinKaikkiSetitTietokantaan() {
        // Luo ensin treeniliike, johon setti lisätään
        Workout.Exercise we = this.insertTestWorkoutExercise();
        // Luo testidata
        List<Workout.Exercise.Set> sets = this.makeCoupleOfWorkoutExerciseSets(we.getId());
        // Lähetä pyyntö
        Response response = this.newPostRequest("workout/exercise/set/all", sets);
        Assert.assertEquals(200, response.getStatus());
        Responses.MultiInsertResponse responseBody = response.readEntity(new GenericType<Responses.MultiInsertResponse>() {});
        // Testaa että insertoitui
        List inserted = utils.selectAllWhere(
            "SELECT * FROM workoutExerciseSet WHERE id IN(:id1, :id2) ORDER BY weight ASC",
            new MapSqlParameterSource().addValue("id1", responseBody.insertIds.get(0))
                .addValue("id2", responseBody.insertIds.get(1)),
            new SimpleMappers.WorkoutExerciseSetMapper()
        );
        sets.get(0).setId(responseBody.insertIds.get(0));
        sets.get(1).setId(responseBody.insertIds.get(1));
        Assert.assertEquals(sets.get(0).toString(), inserted.get(0).toString());
        Assert.assertEquals(sets.get(1).toString(), inserted.get(1).toString());
    }

    @Test
    public void PUTExerciseSetValidoiInputTaulukon() {
        // Simuloi PUT, jonka input-taulukon toinen itemi ei ole validi
        List<Workout.Exercise.Set> workoutSets = this.makeCoupleOfWorkoutExerciseSets(TestData.TEST_WORKOUT_EXERCISE_ID);
        workoutSets.get(1).setReps(0);
        workoutSets.get(1).setWorkoutExerciseId("not-valid-uuid");
        Response response = this.newPutRequest("workout/exercise/set", workoutSets);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("WorkoutController.updateAllExerciseSets.arg0[1].reps", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.updateAllExerciseSets.arg0[1].workoutExerciseId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void PUTExerciseSetPäivittääSetitJaPalauttaaUpdateResponsenJossaPäivitettyjenRivienLukumäärä() {
        // Luo ensin treeniliike, johon setti lisätään
        Workout.Exercise we = this.insertTestWorkoutExercise();
        // Luo lisää sille pari settiä
        List<Workout.Exercise.Set> array = this.makeCoupleOfWorkoutExerciseSets(we.getId());
        Workout.Exercise.Set first = array.get(0);
        Workout.Exercise.Set second = array.get(1);
        utils.insertWorkoutExerciseSet(first);
        utils.insertWorkoutExerciseSet(second);
        // Päivitä niiden tietoja
        first.setWeight(101);
        first.setReps(9);
        second.setWeight(80.45);
        second.setReps(2);
        second.setOrdinal(0);
        // Suorita PUT-pyyntö päivitetyillä tiedoilla
        Response response = this.newPutRequest("workout/exercise/set", array);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 2", (Integer)2, responseBody.updateCount);
        // Testaa, että PUT /api/workout/exercise/set päivitti kummatkin
        List<?> updated = utils.selectAllWhere(
            "SELECT * FROM workoutExerciseSet WHERE id IN(:id1, :id2) ORDER BY weight DESC",
            new MapSqlParameterSource().addValue("id1", first.getId()).addValue("id2", second.getId()),
            new SimpleMappers.WorkoutExerciseSetMapper()
        );
        Assert.assertEquals(2, updated.size());
        Assert.assertEquals(first.toString(), updated.get(0).toString());
        Assert.assertEquals(second.toString(), updated.get(1).toString());
    }

    @Test
    public void DELETEExerciseSetValidoiUrlin() {
        //
        Response response = this.newDeleteRequest("workout/exercise/set/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.deleteWorkoutExerciseSet.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }

    @Test
    public void DELETEExerciseSetPoistaaTreeniliikesetinJaPalauttaaDeleteResponsenJossaPoistettujenRivienLukumäärä() {
        // Luo ensin treeniliike, johon setti lisätään, josta se sitten voidaan poistaa :D
        Workout.Exercise we = this.insertTestWorkoutExercise();
        // Lisää treeniliikesetti
        Workout.Exercise.Set workoutExerciseSet = this.makeCoupleOfWorkoutExerciseSets(we.getId()).get(0);
        utils.insertWorkoutExerciseSet(workoutExerciseSet);
        Assert.assertNotNull(this.selectWorkoutExerciseSet(workoutExerciseSet.getId()));
        // Suorita DELETE-pyyntö
        Response response = this.newDeleteRequest("workout/exercise/set/" + workoutExerciseSet.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 1", (Integer)1, responseBody.deleteCount);
        // Testaa, että poistui
        Assert.assertNull(this.selectWorkoutExerciseSet(workoutExerciseSet.getId()));
    }

    private List<Workout.Exercise.Set> makeCoupleOfWorkoutExerciseSets(String workoutExerciseId) {
        Workout.Exercise.Set data = new Workout.Exercise.Set();
        data.setWeight(100);
        data.setReps(8);
        data.setOrdinal(1);
        data.setWorkoutExerciseId(workoutExerciseId);
        Workout.Exercise.Set data2 = new Workout.Exercise.Set();
        data2.setWeight(102.25);
        data2.setReps(6);
        data2.setOrdinal(3);
        data2.setWorkoutExerciseId(workoutExerciseId);
        //
        List<Workout.Exercise.Set> array = new ArrayList<>();
        array.add(data);
        array.add(data2);
        return array;
    }

    private Workout.Exercise insertTestWorkoutExercise() {
        // Luo ensin treeniliike, johon setti lisätään
        Workout.Exercise we = new Workout.Exercise();
        we.setWorkoutId(testWorkout.getId());
        we.setExerciseId(testExercise.getId());
        utils.insertWorkoutExercise(we);
        return we;
    }

    private Workout.Exercise.Set selectWorkoutExerciseSet(String id) {
        return (Workout.Exercise.Set) utils.selectOneWhere(
            "SELECT * FROM workoutExerciseSet WHERE id = :id",
            new MapSqlParameterSource().addValue("id", id),
            new SimpleMappers.WorkoutExerciseSetMapper()
        );
    }
}
