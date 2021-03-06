package net.mdh.enj.sync;

import net.mdh.enj.HttpClient;
import net.mdh.enj.api.Responses;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import org.junit.BeforeClass;
import org.mockito.Mockito;
import org.junit.Assert;
import org.junit.Test;
import java.util.UUID;

public class OptimizedSyncingTest extends RollbackingDBJerseyTest {

    private HttpClient syncExecutionSpy;
    private static SyncRouteRegister syncRouteRegister;

    @BeforeClass
    public static void beforeClass() {
        // Täytä SyncRouteRegister manuaalisesti, jonka net.mdh.enj.SyncRouteCollector
        // normaalisti suorittaa
        syncRouteRegister = SyncTestUtils.getManuallyPopulatedSyncRouteRegister();
    }

    @Override
    public ResourceConfig configure() {
        // Lisää kuuntelija HTTP-clientille, jossa synkkauspyyntö suoritetaan
        this.syncExecutionSpy = Mockito.mock(HttpClient.class);
        return SyncTestUtils.getResourceConfig(rollbackingDSFactory, syncRouteRegister, this.syncExecutionSpy);
    }

    @Test
    public void syncAllEiKirjoitaTietokantaanJosOptimizerOptimoiQueuenKaikkiItemit() {
        // Simuloi POST, jonka kaikki itemit optimizer eliminoi
        Response response = this.newPostRequest("sync", "[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uuid1\"}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uuid2\"}}," +
            "{\"id\":3,\"route\":{\"url\":\"workout/uuid1\",\"method\":\"DELETE\"},\"data\":null}," +
            "{\"id\":4,\"route\":{\"url\":\"workout/uuid2\",\"method\":\"DELETE\"},\"data\":null}" +
        "]");
        //
        Assert.assertEquals(200, response.getStatus());
        // Ei pitäisi synkata ensimmäistäkään itemiä
        Mockito.verify(this.syncExecutionSpy, Mockito.times(0)).target(Mockito.any(String.class));
        Assert.assertEquals(true, response.readEntity(new GenericType<Responses.GenericResponse>() {}).ok);
    }

    @Test
    public void syncAllEiKirjoitaTietokantaanOptimoinnissaPoistettujaItemeitä() {
        Mockito.when(this.syncExecutionSpy.target("workout"))
            .thenReturn(OptimizedSyncingTest.this.target("workout"));
        // Simuloi POST, josta optimizer eliminoi osan itemeistä
        Response response = this.newPostRequest("sync", ("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{\"id\":\"uuid1\"}}," +
            "{\"id\":2,\"route\":{\"url\":\"workout\",\"method\":\"POST\"},\"data\":{%someWorkoutData}," +
            "{\"id\":3,\"route\":{\"url\":\"workout/uuid1\",\"method\":\"DELETE\"},\"data\":null}" +
        "]").replace("%someWorkoutData",
            "\"id\":\"" + UUID.randomUUID().toString() + "\"," +
            "\"userId\":\"" + TestData.TEST_USER_ID + "\"," +
            "\"start\":1}"
        ));
        //
        Assert.assertEquals(200, response.getStatus());
        // Pitäisi synkata keskimmäinen itemi
        Mockito.verify(this.syncExecutionSpy, Mockito.times(1)).target(Mockito.any(String.class));
        Assert.assertEquals(true, response.readEntity(new GenericType<Responses.GenericResponse>() {}).ok);
    }

    @Test
    public void syncAllParsiiQueryParametrit() {
        String expectedPath = "workout/exercise/" + TestData.TEST_WORKOUT_EXERCISE_ID;
        Mockito.when(this.syncExecutionSpy.target(expectedPath))
            .thenReturn(OptimizedSyncingTest.this.target(expectedPath));
        //
        Response response = this.newPostRequest("sync", ("[" +
            "{\"id\":1,\"route\":{\"url\":\"workout/exercise/%1?workoutId=%2\",\"method\":\"DELETE\"},\"data\":null}" +
        "]").replace("%1", TestData.TEST_WORKOUT_EXERCISE_ID).replace("%2", TestData.TEST_WORKOUT_ID));
        //
        Assert.assertEquals(200, response.getStatus());
        //
        Mockito.verify(this.syncExecutionSpy, Mockito.times(1)).target(expectedPath);
    }
}
