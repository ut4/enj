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
        Assert.assertEquals("WorkoutController.insertWorkoutExercise.arg0", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout/exercise validoi inputin kaikki kentät.
     */
    @Test
    public void POSTExerciseHylkääPyynnönJosTietojaPuuttuu() {
        // Simuloi POST, jonka datassa puuttuu tietoja
        Response response = this.newPostRequest("workout/exercise", "{\"exerciseVariantId\":\"fo\"}");
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(3, errors.size());
        Assert.assertEquals("WorkoutController.insertWorkoutExercise.arg0.exerciseId", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertWorkoutExercise.arg0.exerciseVariantId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertWorkoutExercise.arg0.workoutId", errors.get(2).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(2).getMessageTemplate());
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
        workoutExercise.setOrdinal(2);
        workoutExercise.setExerciseId(testExercise.getId());
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
        Assert.assertEquals(workoutExercise.getOrdinal(), inserted.getOrdinal());
        Assert.assertEquals(workoutExercise.getExerciseId(), inserted.getExerciseId());
        Assert.assertNull(inserted.getExerciseVariantId());
    }

    /**
     * Testaa, että POST /api/workout/exercise/all hylkää pyynnön jos input = null
     */
    @Test
    public void POSTExerciseAllHylkääPyynnönJosDataPuuttuuKokonaan() {
        // Simuloi POST, jossa ei dataa ollenkaan
        Response response = this.newPostRequest("workout/exercise/all", null);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insertAllWorkoutExercises.arg0", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout/exercise/all validoi inputin kaikki kentät.
     */
    @Test
    public void POSTExerciseAllHylkääPyynnönJosBeanistaPuuttuuTietoja() {
        // Simuloi POST, jonka ensimmäinen beani on virheellinen, ja jälkimmäisestä
        // beanista puuttuu tietoja
        List<Workout.Exercise> input = this.makeCoupleOfWorkoutExercises();
        input.get(0).setExerciseVariantId("fo");
        input.get(1).setWorkoutId(null);
        input.get(1).setExerciseId(null);
        Response response = this.newPostRequest("workout/exercise/all", input);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(3, errors.size());
        Assert.assertEquals("WorkoutController.insertAllWorkoutExercises.arg0[0].exerciseVariantId", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertAllWorkoutExercises.arg0[1].exerciseId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertAllWorkoutExercises.arg0[1].workoutId", errors.get(2).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(2).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout/exercise/all lisää kaikki treeniliikkeet
     * tietokantaan, ja palauttaa multiInsertResponsen, jossa uudet id:t.
     */
    @Test
    public void POSTExerciseAllLisääLiikkeetTreeniin() {
        // Luo testidata
        List<Workout.Exercise> input = this.makeCoupleOfWorkoutExercises();
        // Lähetä pyyntö
        Response response = this.newPostRequest("workout/exercise/all", input);
        Assert.assertEquals(200, response.getStatus());
        Responses.MultiInsertResponse responseBody = response.readEntity(new GenericType<Responses.MultiInsertResponse>() {});
        // Testaa että insertoitui, ja palautti id:n
        List inserted = utils.selectAllWhere(
            "SELECT * FROM workoutExercise WHERE id IN (:id, :id2) ORDER BY ordinal ASC",
            new MapSqlParameterSource().addValue("id", responseBody.insertIds.get(0))
                .addValue("id2", responseBody.insertIds.get(1)),
            new SimpleMappers.WorkoutExerciseMapper()
        );
        Workout.Exercise expected1 = input.get(0);
        Workout.Exercise inserted1 = (Workout.Exercise) inserted.get(0);
        Assert.assertEquals(expected1.getWorkoutId(), inserted1.getWorkoutId());
        Assert.assertEquals(expected1.getOrdinal(), inserted1.getOrdinal());
        Assert.assertEquals(expected1.getExerciseId(), inserted1.getExerciseId());
        Assert.assertNull(inserted1.getExerciseVariantId());
        Workout.Exercise expected2 = input.get(1);
        Workout.Exercise inserted2 = (Workout.Exercise) inserted.get(1);
        Assert.assertEquals(expected2.getWorkoutId(), inserted2.getWorkoutId());
        Assert.assertEquals(expected2.getOrdinal(), inserted2.getOrdinal());
        Assert.assertEquals(expected2.getExerciseId(), inserted2.getExerciseId());
        Assert.assertNull(inserted2.getExerciseVariantId());
    }

    @Test
    public void PUTExerciseValidoiInputTaulukon() {
        // Simuloi PUT, jonka input-taulukon toinen itemi ei ole validi
        List<Workout.Exercise> workouts = this.makeCoupleOfWorkoutExercises();
        workouts.get(1).setWorkoutId("not-valid-uuid");
        workouts.get(1).setExerciseId(null);
        workouts.get(1).setExerciseVariantId("asd");
        Response response = this.newPutRequest("workout/exercise", workouts);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(3, errors.size());
        Assert.assertEquals("WorkoutController.updateAllExercises.arg0[1].exerciseId", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.updateAllExercises.arg0[1].exerciseVariantId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("WorkoutController.updateAllExercises.arg0[1].workoutId", errors.get(2).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(2).getMessageTemplate());
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
        first.setOrdinal(4);
        first.setExerciseVariantId(variant.getId());
        second.setOrdinal(5);
        // Suorita PUT-pyyntö päivitetyillä tiedoilla
        Response response = this.newPutRequest("workout/exercise", array);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 2", (Integer)2, responseBody.updateCount);
        // Testaa, että PUT /api/workout/exercise päivitti kummatkin
        List<?> updated = utils.selectAllWhere(
            "SELECT * FROM workoutExercise WHERE id IN(:id1, :id2) ORDER BY ordinal ASC",
            new MapSqlParameterSource().addValue("id1", first.getId()).addValue("id2", second.getId()),
            new SimpleMappers.WorkoutExerciseMapper()
        );
        Assert.assertEquals(2, updated.size());
        Workout.Exercise updated1 = (Workout.Exercise)updated.get(0);
        Workout.Exercise updated2 = (Workout.Exercise)updated.get(1);
        Assert.assertEquals(4, updated1.getOrdinal());
        Assert.assertEquals(first.getExerciseId(), updated1.getExerciseId());
        Assert.assertEquals(first.getExerciseVariantId(), updated1.getExerciseVariantId());
        Assert.assertEquals(5, updated2.getOrdinal());
        Assert.assertEquals(second.getExerciseId(), updated2.getExerciseId());
        Assert.assertNull(updated2.getExerciseVariantId());
    }

    @Test
    public void DELETEExerciseValidoiUrlin() {
        //
        Response response = this.newDeleteRequest("workout/exercise/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.deleteWorkoutExercise.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }

    /*
     * Testaa samalla, että workoutExerciseDeleteTrg (ks. @/backend/schema.mariadb.sql)
     * poistaa treeniliikkeelle kuuluvat setit.
     */
    @Test
    public void DELETEExercisePoistaaTreeniliikkeenJaPalauttaaDeleteResponsenJossaPoistettujenRivienLukumäärä() {
        // Lisää ensin treeniliike & sille yksi sarja
        Workout.Exercise workoutExercise = this.makeCoupleOfWorkoutExercises().get(0);
        utils.insertWorkoutExercise(workoutExercise);
        Workout.Exercise.Set workoutExerciseSet = new Workout.Exercise.Set();
        workoutExerciseSet.setWeight(1);
        workoutExerciseSet.setReps(1);
        workoutExerciseSet.setWorkoutExerciseId(workoutExercise.getId());
        utils.insertWorkoutExerciseSet(workoutExerciseSet);
        Assert.assertEquals((Integer)2, this.selectDataCount(workoutExercise.getId()));
        // Suorita DELETE-pyyntö
        Response response = this.newDeleteRequest("workout/exercise/" + workoutExercise.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 1", (Integer)1, responseBody.deleteCount);
        // Testaa, että treeniliike JA sarja poistui
        Assert.assertEquals((Integer)0, this.selectDataCount(workoutExercise.getId()));
    }

    private List<Workout.Exercise> makeCoupleOfWorkoutExercises() {
        Workout.Exercise data = new Workout.Exercise();
        data.setOrdinal(1);
        data.setWorkoutId(testWorkout.getId());
        data.setExerciseId(testExercise.getId());
        Workout.Exercise data2 = new Workout.Exercise();
        data2.setOrdinal(2);
        data2.setWorkoutId(testWorkout.getId());
        data2.setExerciseId(testExercise.getId());
        //
        List<Workout.Exercise> array = new ArrayList<>();
        array.add(data);
        array.add(data2);
        return array;
    }

    /*
     * Palauttaa treeniliikeen, ja sille kuuluvien settien yhteislukumäärän.
     */
    private Integer selectDataCount(String workouExerciseId) {
        Integer count = (Integer) utils.selectOneWhere(
            "SELECT COUNT(id) as count FROM (" +
                "SELECT id FROM workoutExercise WHERE id = :id" +
                    " UNION ALL" +
                " SELECT id FROM workoutExerciseSet WHERE workoutExerciseId = :id" +
            ") as fo",
            new MapSqlParameterSource().addValue("id", workouExerciseId),
            (rs, i) -> rs.getInt("count")
        );
        return count != null ? count : 0;
    }
}
