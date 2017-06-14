package net.mdh.enj.workout;

import org.junit.Before;
import org.junit.Test;
import org.junit.Assert;
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
import java.util.List;

public class WorkoutControllerTest extends RollbackingDBJerseyTest {

    private static Workout testWorkout;
    private DbTestUtils utils;

    public WorkoutControllerTest() {
        super();
        this.utils = new DbTestUtils(this.rollbackingDataSource);
    }

    @Before
    public void beforeEach() {
        if (testWorkout == null) {
            testWorkout = new Workout();
            testWorkout.setStart(System.currentTimeMillis() / 1000L);
            this.utils.insertWorkout(testWorkout);
        }
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
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                }
            });
    }

    /**
     * Testaa, että POST /api/workout palauttaa virheen, jos inputin arvo
     * evaluoituu null.
     */
    @Test
    public void POSTHylkääNullArvon() {
        // Simuloi POST, jossa ei dataa ollenkaan
        Response response = this.newWorkoutPostRequest(null);
        // Testaa että palauttaa 400
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = response.readEntity(new GenericType<List<ValidationError>>() {});
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insert.arg0", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout validoi input datan.
     */
    @Test
    public void POSTValidoiTreeniInputin() {
        // Simuloi POST, jossa tyhjä workout
        Workout invalidData = new Workout();
        Response response = this.newWorkoutPostRequest(invalidData);
        // Testaa että palauttaa 400
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = response.readEntity(new GenericType<List<ValidationError>>() {});
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("WorkoutController.insert.arg0.start", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
    }

    /**
     * Testaa, että POST /api/workout lisää treenin tietokantaan post-datan tie-
     * doilla, ja palauttaa luodun treenin id:n.
     */
    @Test
    public void POSTLisääTreeninJaPalauttaaTreeninIdn() {
        // Luo testidata
        Workout data = new Workout();
        data.setStart(System.currentTimeMillis() / 1000L);
        data.setNotes("foo");
        // Testaa että insertointi pyynnön tiedoilla
        Response response = target("workout").request().post(Entity.entity(data, MediaType.APPLICATION_JSON_TYPE));
        Assert.assertEquals(200, response.getStatus());
        Integer responseBody = response.readEntity(new GenericType<Integer>() {});
        data.setId(responseBody);
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

    private Response newWorkoutPostRequest(Workout data) {
        return target("workout")
            .request(MediaType.APPLICATION_JSON_TYPE)
            .post(Entity.entity(data, MediaType.APPLICATION_JSON_TYPE));
    }
}
