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
 * Testailee /api/workout -REST-reitit.
 */
public class WorkoutControllerHandlersTest extends WorkoutControllerTestCase {

    /**
     * Testaa, että POST /api/workout palauttaa virheen, jos inputin arvo
     * evaluoituu null.
     */
    @Test
    public void POSTHylkääPyynnönJosDataPuuttuuKokonaan() {
        this.assertRequestFailsOnNullInput("workout", "WorkoutController.insert");
    }

    /**
     * Testaa, että POST /api/workout validoi inputin kaikki kentät.
     */
    @Test
    public void POSTValidoiTreeniInputin() {
        // Simuloi POST, jossa tyhjä workout
        Workout invalidData = new Workout();
        Response response = this.newPostRequest("workout", invalidData);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("WorkoutController.insert.arg0.start", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insert.arg0.userId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.AuthenticatedUserId.message}", errors.get(1).getMessageTemplate());
    }

    /**
     * Testaa, ettei käyttäjä voi luoda treenejä kuin itselleen.
     */
    @Test
    public void POSTHylkääPyynnönJosInputinUserIdEiOleSamaKuinKirjautuneenKäyttäjänId() {
        // Simuloi POST, jonka data muuten ok, mutta userId ei täsmää kirjautuneen käyttäjän id:n kanssa
        Workout workout = new Workout();
        workout.setStart(2);
        workout.setUserId(TestData.TEST_USER_ID + 1);
        Response response = this.newPostRequest("workout", workout);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insert.arg0.userId", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.AuthenticatedUserId.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout lisää treenin tietokantaan inputin tie-
     * doilla, ja palauttaa insertResponsen, jossa luodun treenin id.
     */
    @Test
    public void POSTLisääTreeninJaPalauttaaInsertResponsenJossaTreeninUusiId() {
        //
        Workout data = new Workout();
        data.setStart(WorkoutControllerHandlersTest.testWorkout.getStart() + 1);
        data.setNotes("foo");
        data.setUserId(TestData.TEST_USER_ID);
        //
        Response response = this.newPostRequest("workout", data);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        // Testaa että insertoitui, ja palautti oikean id:n
        Workout workout = this.selectWorkout(responseBody.insertId);
        data.setId(responseBody.insertId);
        Assert.assertEquals(data.toString(), workout.toString());
    }

    /**
     * Testaa, että POST /api/workout/all palauttaa virheen, jos inputin arvo
     * evaluoituu null.
     */
    @Test
    public void POSTAllHylkääPyynnönJosDataPuuttuuKokonaan() {
        // Simuloi POST, jossa ei dataa ollenkaan
        Response response = this.newPostRequest("workout/all", null);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insertAll.arg0", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout/all validoi input-taulukon kaikki beanit.
     */
    @Test
    public void POSTAllValidoiKaikkiInputinTreenit() {
        // Simuloi POST, jonka ensimmäinen bean on virheellinen
        List<Workout> input = this.makeCoupleOfWorkouts();
        input.get(0).setStart(0);
        input.get(0).setUserId(null);
        Response response = this.newPostRequest("workout/all", input);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("WorkoutController.insertAll.arg0[0].start", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertAll.arg0[0].userId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.AuthenticatedUserId.message}", errors.get(1).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout/all lisää kaikki inputin treenit tietokantaan,
     * ja palauttaa multiInsertResponsen, jossa luotujen treenin id:t.
     */
    @Test
    public void POSTAllLisääTreeninJaPalauttaaMultiInsertResponsenJossaTreeninUudetIdt() {
        //
        List<Workout> input = this.makeCoupleOfWorkouts();
        Response response = this.newPostRequest("workout/all", input);
        Assert.assertEquals(200, response.getStatus());
        //
        Responses.MultiInsertResponse responseBody = response.readEntity(new GenericType<Responses.MultiInsertResponse>() {});
        // Testaa että insertoitui
        List inserted = utils.selectAllWhere(
            "SELECT * FROM workout WHERE id IN (:id1, :id2) ORDER BY `start` ASC",
            new MapSqlParameterSource().addValue("id1", responseBody.insertIds.get(0))
                .addValue("id2", responseBody.insertIds.get(1)),
            new SimpleMappers.WorkoutMapper()
        );
        input.get(0).setId(responseBody.insertIds.get(0));
        input.get(1).setId(responseBody.insertIds.get(1));
        Assert.assertEquals(input.get(0).toString(), inserted.get(0).toString());
        Assert.assertEquals(input.get(1).toString(), inserted.get(1).toString());
    }

    /**
     * Testaa, että GET /api/workout palauttaa ArrayList:illisen Workout:eja,
     * jossa uusimmat / viimeksi insertoidut ensimmäisenä.
     */
    @Test
    public void GETPalauttaaTreenilistan() {
        Response response = this.newGetRequest("workout");
        Assert.assertEquals(200, response.getStatus());
        List<Workout> workouts = response.readEntity(new GenericType<List<Workout>>() {});
        Assert.assertEquals(testWorkout.toString(), workouts.get(0).toString());
    }

    /**
     * Testaa, että GET /api/workout?startFrom={timestamp}&startTo={timestamp} käyttää
     * url-paremetrejä tietokantakyselyn filtteröintiin, ja palauttaa tulokset
     * uusimmat / viimeksi insertoidut ensimmäisenä.
     */
    @Test
    public void GETPalauttaaTreenitAikaväliltä() {
        Workout anotherWorkout = new Workout();
        anotherWorkout.setStart(1); // 1970-01-01T00:00:01
        anotherWorkout.setUserId(TestData.TEST_USER_ID);
        anotherWorkout.setExercises(new ArrayList<>());
        utils.insertWorkout(anotherWorkout);
        Workout anotherWorkout2 = new Workout();
        anotherWorkout2.setStart(3); // 1970-01-01T00:00:03
        anotherWorkout2.setUserId(TestData.TEST_USER_ID);
        anotherWorkout2.setExercises(new ArrayList<>());
        utils.insertWorkout(anotherWorkout2);
        Response response = this.newGetRequest("workout", t ->
            t.queryParam("startFrom", "1").queryParam("startTo", "3")
        );
        Assert.assertEquals(200, response.getStatus());
        List<Workout> workouts = response.readEntity(new GenericType<List<Workout>>() {});
        Assert.assertEquals(2, workouts.size()); // Pitäisi palauttaa aina 2, ks. timestamp
        Assert.assertEquals(anotherWorkout2.toString(), workouts.get(0).toString());
        Assert.assertEquals(anotherWorkout.toString(), workouts.get(1).toString());
    }

    @Test
    public void PUTValidoiInputTaulukon() {
        // Simuloi PUT, jonka input-taulukon toinen itemi on cag
        List<Workout> workouts = this.makeCoupleOfWorkouts();
        workouts.get(1).setStart(0);
        workouts.get(1).setUserId("gier");
        Response response = this.newPutRequest("workout", workouts);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("WorkoutController.updateMany.arg0[1].start", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.updateMany.arg0[1].userId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.AuthenticatedUserId.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void PUTPäivittääTreenitJaPalauttaaUpdateResponsenJossaPäivitettyjenRivienLukumäärä() {
        // Luo ensin pari treeniä
        List<Workout> array = this.makeCoupleOfWorkouts();
        Workout first = array.get(0);
        Workout second = array.get(1);
        utils.insertWorkout(first);
        utils.insertWorkout(second);
        // Päivitä niiden tietoja
        first.setNotes("fsroi");
        first.setStart(first.getStart() + 1);
        second.setNotes("ster");
        second.setStart(second.getStart() + 1);
        // Suorita PUT-pyyntö päivitetyillä tiedoilla
        Response response = this.newPutRequest("workout", array);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 2", (Integer)2, responseBody.updateCount);
        // Testaa, että PUT /api/workout päivitti kummatkin
        List<?> updated = utils.selectAllWhere(
            "SELECT * FROM workout WHERE id IN(:id1, :id2) ORDER BY notes ASC",
            new MapSqlParameterSource().addValue("id1", first.getId()).addValue("id2", second.getId()),
            new SimpleMappers.WorkoutMapper()
        );
        Assert.assertEquals(2, updated.size());
        Assert.assertEquals(first.getNotes(), ((Workout)updated.get(0)).getNotes());
        Assert.assertEquals(first.getStart(), ((Workout)updated.get(0)).getStart());
        Assert.assertEquals(second.getNotes(), ((Workout)updated.get(1)).getNotes());
        Assert.assertEquals(second.getStart(), ((Workout)updated.get(1)).getStart());
    }

    @Test
    public void DELETEValidoiUrlin() {
        //
        Response response = this.newDeleteRequest("workout/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.delete.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa samalla, että workoutDeleteTrg (ks. @/backend/schema.mariadb.sql)
     * poistaa treeniin kuuluvat treeniliikkeet.
     */
    @Test
    public void DELETEPoistaaTreeninJaPalauttaaDeleteResponsenJossaPoistettujenRivienLukumäärä() {
        // Lisää treeni
        Workout workout = this.makeCoupleOfWorkouts().get(0);
        utils.insertWorkout(workout);
        // Lisää treenille yksi liike
        Workout.Exercise we = new Workout.Exercise();
        we.setWorkoutId(workout.getId());
        we.setExerciseId(testExercise.getId());
        utils.insertWorkoutExercise(we);
        Assert.assertEquals("Treeni, ja treeniliike pitäisi olla insertoituneena tietokantaan",
            (Integer)2, this.selectDataCount(workout.getId()));
        // Suorita DELETE-pyyntö
        Response response = this.newDeleteRequest("workout/" + workout.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 1", (Integer)1, responseBody.deleteCount);
        // Testaa, että poistui
        Assert.assertEquals("Pitäisi poistaa treeni, ja treeniliike tietokannasta", (Integer)0,
            this.selectDataCount(workout.getId()));
    }

    public static Workout makeNewWorkoutEntity(String userId) {
        Workout data = new Workout();
        data.setStart(System.currentTimeMillis() / 1000L);
        data.setNotes("fus");
        data.setUserId(userId);
        return data;
    }

    private List<Workout> makeCoupleOfWorkouts() {
        Workout data = makeNewWorkoutEntity(TestData.TEST_USER_ID);
        Workout data2 = new Workout();
        data2.setStart(data.getStart() + 1);
        data2.setNotes("ro");
        data2.setUserId(TestData.TEST_USER_ID);
        //
        List<Workout> array = new ArrayList<>();
        array.add(data);
        array.add(data2);
        return array;
    }

    private Workout selectWorkout(String id) {
        return (Workout) utils.selectOneWhere(
            "SELECT * FROM workout WHERE id = :id",
            new MapSqlParameterSource().addValue("id", id),
            new SimpleMappers.WorkoutMapper()
        );
    }

    /*
     * Palauttaa treenin, ja sille kuuluvien treeniliikkeiden yhteislukumäärän.
     */
    private Integer selectDataCount(String workouId) {
        Integer count = (Integer) utils.selectOneWhere(
            "SELECT COUNT(id) as count FROM (" +
                "SELECT id FROM workout WHERE id = :id" +
                " UNION ALL" +
                " SELECT id FROM workoutExercise WHERE workoutId = :id" +
            ") as fo",
            new MapSqlParameterSource().addValue("id", workouId),
            (rs, i) -> rs.getInt("count")
        );
        return count != null ? count : 0;
    }
}
