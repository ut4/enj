package net.mdh.enj.workout;

import net.mdh.enj.api.Responses;
import net.mdh.enj.exercise.Exercise;
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
 * Testailee kaikki /api/workout/exercise -REST-reitit.
 */
public class WorkoutExerciseControllerHandlersTest extends WorkoutControllerTestCase{

    /**
     * Testaa, että POST /api/workout/exercise hylkää pyynnön jos input = null
     */
    @Test
    public void POSTExerciseHylkääPyynnönJosDataPuuttuuKokonaan() {
        // Simuloi POST, jossa ei dataa ollenkaan
        Response response = this.newPostRequest("workout/exercise", null);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insertExercise.arg0", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout/exercise validoi inputin kaikki kentät.
     */
    @Test
    public void POSTExerciseHylkääPyynnönJosTietojaPuuttuu() {
        // Simuloi POST, jonka datassa puuttuu tietoja
        Response response = this.newPostRequest("workout/exercise", "{}");
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("WorkoutController.insertExercise.arg0.exercise", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertExercise.arg0.workoutId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout/exercise lisää treeniliikkeen tietokantaan
     * inputin tiedoilla, ja palauttaa insertResponsen, jossa uusi id.
     */
    @Test
    public void POSTExerciseLisääLiikkeenTreeniin() {
        // Luo testidata
        Workout.Exercise workoutExercise = new Workout.Exercise();
        workoutExercise.setWorkoutId(testWorkout.getId());
        workoutExercise.setOrderDef(2);
        workoutExercise.setExercise(testExercise);
        workoutExercise.setExerciseVariant(new Exercise.Variant());
        // Lähetä pyyntö
        Response response = this.newPostRequest("workout/exercise", workoutExercise);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        // Testaa että insertoitui, ja palautti id:n
        Workout.Exercise inserted = (Workout.Exercise) utils.selectOneWhere(
            "SELECT * FROM workoutExercise WHERE id = :id",
            new MapSqlParameterSource().addValue("id", responseBody.insertId),
            new SimpleMappers.WorkoutExerciseMapper()
        );
        Assert.assertEquals(workoutExercise.getWorkoutId(), inserted.getWorkoutId());
        Assert.assertEquals(workoutExercise.getOrderDef(), inserted.getOrderDef());
        Assert.assertEquals(workoutExercise.getExercise().getId(), inserted.getExercise().getId());
        Assert.assertNull(inserted.getExerciseVariant().getId());
    }

    @Test
    public void PUTExerciseValidoiInputTaulukon() {
        // Simuloi PUT, jonka input-taulukon toinen itemi ei ole validi
        List<Workout.Exercise> workouts = this.makeCoupleOfWorkoutExercises();
        workouts.get(1).setWorkoutId("not-valid-uuid");
        workouts.get(1).setExercise(null);
        Response response = this.newPutRequest("workout/exercise", workouts);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("WorkoutController.updateAllExercises.arg0[1].exercise", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.updateAllExercises.arg0[1].workoutId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void PUTExercisePäivittääTreeniliikkeetJaPalauttaaUpdateResponsenJossaPäivitettyjenRivienLukumäärä() {
        // Testivariantti
        Exercise.Variant variant = new Exercise.Variant();
        variant.setContent("fus");
        variant.setExerciseId(testExercise.getId());
        utils.insertExerciseVariant(variant);
        // Luo ensin pari treeniliikettä
        List<Workout.Exercise> array = this.makeCoupleOfWorkoutExercises();
        Workout.Exercise first = array.get(0);
        Workout.Exercise second = array.get(1);
        utils.insertWorkoutExercise(first);
        utils.insertWorkoutExercise(second);
        // Päivitä niiden tietoja
        first.setOrderDef(4);
        first.setExerciseVariant(variant);
        second.setOrderDef(5);
        // Suorita PUT-pyyntö päivitetyillä tiedoilla
        Response response = this.newPutRequest("workout/exercise", array);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 2", (Integer)2, responseBody.updateCount);
        // Testaa, että PUT /api/workout/exercise päivitti kummatkin
        List<?> updated = utils.selectAllWhere(
            "SELECT * FROM workoutExercise WHERE id IN(:id1, :id2) ORDER BY orderDef ASC",
            new MapSqlParameterSource().addValue("id1", first.getId()).addValue("id2", second.getId()),
            new SimpleMappers.WorkoutExerciseMapper()
        );
        Assert.assertEquals(2, updated.size());
        Workout.Exercise updated1 = (Workout.Exercise)updated.get(0);
        Workout.Exercise updated2 = (Workout.Exercise)updated.get(1);
        Assert.assertEquals(4, updated1.getOrderDef());
        Assert.assertEquals(first.getExercise().getId(), updated1.getExercise().getId());
        Assert.assertEquals(first.getExerciseVariant().getId(), updated1.getExerciseVariant().getId());
        Assert.assertEquals(5, updated2.getOrderDef());
        Assert.assertEquals(second.getExercise().getId(), updated2.getExercise().getId());
        Assert.assertNull(updated2.getExerciseVariant().getId());
    }

    private List<Workout.Exercise> makeCoupleOfWorkoutExercises() {
        Workout.Exercise data = new Workout.Exercise();
        data.setOrderDef(1);
        data.setWorkoutId(testWorkout.getId());
        data.setExercise(testExercise);
        data.setExerciseVariant(new Exercise.Variant());
        Workout.Exercise data2 = new Workout.Exercise();
        data2.setOrderDef(2);
        data2.setWorkoutId(testWorkout.getId());
        data2.setExercise(testExercise);
        data2.setExerciseVariant(new Exercise.Variant());
        //
        List<Workout.Exercise> array = new ArrayList<>();
        array.add(data);
        array.add(data2);
        return array;
    }
}
