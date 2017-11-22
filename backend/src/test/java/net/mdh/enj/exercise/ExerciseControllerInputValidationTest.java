package net.mdh.enj.exercise;

import net.mdh.enj.api.RequestContext;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.JerseyTestCase;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.validation.ValidationError;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.mockito.Mockito;
import org.junit.Assert;
import org.junit.Test;
import javax.ws.rs.core.Response;
import java.util.List;

public class ExerciseControllerInputValidationTest extends JerseyTestCase {

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(ExerciseController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(Mockito.mock(ExerciseRepository.class)).to(ExerciseRepository.class);
                    bind(Mockito.mock(ExerciseVariantRepository.class)).to(ExerciseVariantRepository.class);
                }
            });
    }

    @Test
    public void POSTExerciseHylkääNullInputin() {
        this.assertRequestFailsOnNullInput("exercise", "ExerciseController.insert");
    }

    @Test
    public void POSTExerciseValidoiInputin() {
        Exercise invalidData = new Exercise();
        invalidData.setName("f");
        Response response = this.newPostRequest("exercise", invalidData);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("ExerciseController.insert.arg0.name", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(0).getMessageTemplate());
    }

    @Test
    public void PUTValidoiInputin() {
        Response response = this.newPutRequest("exercise/invaliduuid", "{}");
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("ExerciseController.update.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ExerciseController.update.arg1.name", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void POSTExerciseVariantHylkääNullInputin() {
        this.assertRequestFailsOnNullInput("exercise/variant", "ExerciseController.insertVariant");
    }

    @Test
    public void POSTExerciseVariantValidoiInputin() {
        Exercise.Variant invalidVariant = new Exercise.Variant();
        invalidVariant.setContent("b");
        Response response = this.newPostRequest("exercise/variant", invalidVariant);
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("ExerciseController.insertVariant.arg0.content", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ExerciseController.insertVariant.arg0.exerciseId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void PUTVariantValidoiInputin() {
        Response response = this.newPutRequest("exercise/variant/invaliduuid", "{}");
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(3, errors.size());
        Assert.assertEquals("ExerciseController.updateVariant.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ExerciseController.updateVariant.arg1.content", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ExerciseController.updateVariant.arg1.exerciseId", errors.get(2).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(2).getMessageTemplate());
    }

    @Test
    public void DELETEVariantValidoiUrlin() {
        //
        Response response = this.newDeleteRequest("exercise/variant/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("ExerciseController.deleteExerciseVariant.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }
}
