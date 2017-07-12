package net.mdh.enj.workout;

import net.mdh.enj.APIResponses;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.Assert;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.validation.ValidationError;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import java.util.Comparator;
import java.util.List;

public class WorkoutControllerTest extends RollbackingDBJerseyTest {

    private static Workout testWorkout;
    private static Exercise testExercise;
    private static DbTestUtils utils;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDataSource);
        testWorkout = new Workout();
        testWorkout.setStart(System.currentTimeMillis() / 1000L);
        utils.insertWorkout(testWorkout);
        testExercise = new Exercise();
        testExercise.setName("exs");
        utils.insertExercise(testExercise);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(WorkoutController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(WorkoutRepository.class).to(WorkoutRepository.class);
                    bind(WorkoutExerciseRepository.class).to(WorkoutExerciseRepository.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                }
            });
    }

    /**
     * Testaa, että POST /api/workout palauttaa virheen, jos inputin arvo
     * evaluoituu null.
     */
    @Test
    public void POSTHylkääPyynnönJosDataPuuttuuKokonaan() {
        // Simuloi POST, jossa ei dataa ollenkaan
        Response response = this.newPostRequest("workout", null);
        // Testaa että palauttaa 400
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = response.readEntity(new GenericType<List<ValidationError>>() {});
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insert.arg0", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout validoi inputin kaikki kentät.
     */
    @Test
    public void POSTValidoiTreeniInputin() {
        // Simuloi POST, jossa tyhjä workout
        Workout invalidData = new Workout();
        Response response = this.newPostRequest("workout", invalidData);
        // Testaa että palauttaa 400
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = response.readEntity(new GenericType<List<ValidationError>>() {});
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insert.arg0.start", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout lisää treenin tietokantaan inputin tie-
     * doilla, ja palauttaa insertResponsen, jossa luodun treenin id.
     */
    @Test
    public void POSTLisääTreeninJaPalauttaaInsertReponsenJossaTreeninUusiId() {
        // Luo testidata
        Workout data = new Workout();
        data.setStart(System.currentTimeMillis() / 1000L);
        data.setNotes("foo");
        // Testaa että insertoi pyynnön tiedoilla
        Response response = this.newPostRequest("workout", data);
        Assert.assertEquals(200, response.getStatus());
        APIResponses.InsertResponse responseBody = response.readEntity(new GenericType<APIResponses.InsertResponse>() {});
        data.setId(responseBody.insertId);
        // Testaa että insertoitui, ja palautti id:n
        Response getResponse = target("workout").request().get();
        List<Workout> workouts = getResponse.readEntity(new GenericType<List<Workout>>() {});
        Assert.assertEquals(data.toString(), workouts.get(0).toString());
    }

    /**
     * Testaa, että GET /api/workout palauttaa ArrayList:illisen Workout:eja,
     * jossa uusimmat / viimeksi insertoidut ensimmäisenä.
     */
    @Test
    public void GETPalauttaaTreenilistan() {
        Response response = target("workout").request().get();
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
        utils.insertWorkout(anotherWorkout);
        Workout anotherWorkout2 = new Workout();
        anotherWorkout2.setStart(3); // 1970-01-01T00:00:03
        utils.insertWorkout(anotherWorkout2);
        Response response = target("workout").queryParam("startFrom", "1").queryParam("startTo", "3").request().get();
        Assert.assertEquals(200, response.getStatus());
        List<Workout> workouts = response.readEntity(new GenericType<List<Workout>>() {});
        Assert.assertEquals(2, workouts.size()); // Pitäisi palauttaa aina 2, ks. timestamp
        Assert.assertEquals(anotherWorkout2.toString(), workouts.get(0).toString());
        Assert.assertEquals(anotherWorkout.toString(), workouts.get(1).toString());
    }

    /**
     * Testaa, että POST /api/workout/exercise hylkää pyynnön jos input = null
     */
    @Test
    public void POSTExerciseHylkääPyynnönJosDataPuuttuuKokonaan() {
        // Simuloi POST, jossa ei dataa ollenkaan
        Response response = this.newPostRequest("workout/exercise", null);
        // Testaa että palauttaa 400
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = response.readEntity(new GenericType<List<ValidationError>>() {});
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
        // Testaa että palauttaa 400
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = response.readEntity(new GenericType<List<ValidationError>>() {});
        Assert.assertEquals(2, errors.size());
        errors.sort(Comparator.comparing(ValidationError::getPath));
        Assert.assertEquals("WorkoutController.insertExercise.arg0.exercise", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("WorkoutController.insertExercise.arg0.workoutId", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(1).getMessageTemplate());
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
        workoutExercise.setOrderDef(0);
        workoutExercise.setExercise(testExercise);
        // Testaa että insertoi pyynnön tiedoilla
        Response response = this.newPostRequest("workout/exercise", workoutExercise);
        Assert.assertEquals(200, response.getStatus());
        APIResponses.InsertResponse responseBody = response.readEntity(new GenericType<APIResponses.InsertResponse>() {});
        workoutExercise.setId(responseBody.insertId);
        // Testaa että insertoitui, ja palautti id:n
        Response getResponse = target("workout").request().get();
        List<Workout> workouts = getResponse.readEntity(new GenericType<List<Workout>>() {});
        Workout fetchedTestWorkout = workouts.stream().filter(w -> w.getId() == testWorkout.getId()).findFirst().get();
        Assert.assertEquals(workoutExercise.toString(), fetchedTestWorkout.getExercises().get(0).toString());
    }
}
