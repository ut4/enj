package net.mdh.enj.sync;

import net.mdh.enj.HttpClient;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.resources.JerseyTestCase;
import net.mdh.enj.resources.TestData;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.validation.ValidationError;
import javax.ws.rs.core.Response;
import org.junit.Assert;
import org.junit.Test;
import java.util.List;

public class SyncControllerTest extends JerseyTestCase {

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(SyncController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(new SyncRouteRegister()).to(SyncRouteRegister.class);
                    bind(SyncControllerTest.this).to(HttpClient.class);
                }
            });
    }

    @Test
    public void POSTHylkääPyynnönJosDataPuuttuuKokonaan() {
        this.assertRequestFailsOnNullInput("sync", "SyncController.syncAll");
    }

    @Test
    public void POSTValidoiInputBeanienKaikkiKentät() {
        // Simuloi POST, jossa kaksi virheellistä itemiä
        Response response = this.newPostRequest("sync", "[{\"id\":0},{\"id\":1}]");
        // Testaa että palauttaa 400
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals("SyncController.syncAll.arg0[0].data", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("SyncController.syncAll.arg0[0].id", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("SyncController.syncAll.arg0[0].route", errors.get(2).getPath());
        Assert.assertEquals("{net.mdh.enj.sync.validation.SyncableRoute.message}", errors.get(2).getMessageTemplate());
        Assert.assertEquals("SyncController.syncAll.arg0[1].data", errors.get(3).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(3).getMessageTemplate());
        Assert.assertEquals("SyncController.syncAll.arg0[1].route", errors.get(4).getPath());
        Assert.assertEquals("{net.mdh.enj.sync.validation.SyncableRoute.message}", errors.get(4).getMessageTemplate());
    }
}
