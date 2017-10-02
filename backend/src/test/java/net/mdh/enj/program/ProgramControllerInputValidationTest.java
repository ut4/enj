package net.mdh.enj.program;

import net.mdh.enj.api.RequestContext;
import net.mdh.enj.resources.JerseyTestCase;
import net.mdh.enj.resources.TestData;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.validation.ValidationError;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;
import javax.ws.rs.core.Response;
import java.util.List;

public class ProgramControllerInputValidationTest extends JerseyTestCase {

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(ProgramController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(Mockito.mock(ProgramRepository.class)).to(ProgramRepository.class);
                }
            });
    }

    @Test
    public void POSTInsertHylkääPyynnönJosDataPuuttuuKokonaan() {
        this.assertRequestFailsOnNullInput("program", "ProgramController.insert");
    }

    @Test
    public void POSTInsertValidoiInputDatan() {
        Program badData = new Program();
        badData.setName("s");
        badData.setStart(-1L);
        badData.setEnd(-1L);
        Response response = this.newPostRequest("program", badData);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals("ProgramController.insert.arg0.end", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.name", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.start", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(2).getMessageTemplate());
    }

    @Test
    public void POSTInsertEiHyväksyNullArvoja() {
        Program badData = new Program();
        badData.setName(null);
        badData.setStart(null);
        badData.setEnd(null);
        Response response = this.newPostRequest("program", badData);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals("ProgramController.insert.arg0.end", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.name", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.start", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(2).getMessageTemplate());
    }

    @Test
    public void GETValidoiUrlin() {
        //
        Response response = this.newGetRequest("program/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("ProgramController.getMyProgram.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }
}
