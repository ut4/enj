package net.mdh.enj.auth;

import java.util.List;
import org.mockito.Mockito;
import javax.ws.rs.core.Response;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.JerseyTestCase;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.validation.ValidationError;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Assert;
import org.junit.Test;

public class AuthControllerInputValidationTest extends JerseyTestCase {

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(AuthController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(Mockito.mock(AuthService.class)).to(AuthService.class);
                }
            });
    }

    @Test
    public void POSTLoginValidoiInputDatan() {
        Response responseForEmptyInput;
        List<ValidationError> errorsForEmptyInput;
        Response responseForBadInput;
        List<ValidationError> errorsForBadInput;

        // Tyhjä/null request data
        this.assertRequestFailsOnNullInput("auth/login", "AuthController.login");

        // Bean-validaatio, null
        LoginCredentials emptyData = new LoginCredentials();
        responseForEmptyInput = this.newPostRequest("auth/login", emptyData);
        Assert.assertEquals(400, responseForEmptyInput.getStatus());
        errorsForEmptyInput = this.getValidationErrors(responseForEmptyInput);
        Assert.assertEquals("AuthController.login.arg0.password", errorsForEmptyInput.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errorsForEmptyInput.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.login.arg0.username", errorsForEmptyInput.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errorsForEmptyInput.get(1).getMessageTemplate());

        // Bean-validaatio, liian lyhyet username&password-arvot
        LoginCredentials badData = new LoginCredentials();
        badData.setUsername("f");
        badData.setPassword(new char[]{'f', 'o', 'o'});
        responseForBadInput = this.newPostRequest("auth/login", badData);
        Assert.assertEquals(400, responseForBadInput.getStatus());
        errorsForBadInput = this.getValidationErrors(responseForBadInput);
        Assert.assertEquals("AuthController.login.arg0.password", errorsForBadInput.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errorsForBadInput.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.login.arg0.username", errorsForBadInput.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errorsForBadInput.get(1).getMessageTemplate());
    }

    @Test
    public void POSTRegisterHylkääPyynnönJosDataPuuttuuKokonaan() {
        this.assertRequestFailsOnNullInput("auth/register", "AuthController.register");
    }

    @Test
    public void POSTRegisterValidoiInputDatan() {
        RegistrationCredentials badData = new RegistrationCredentials();
        badData.setUsername("f");
        badData.setPassword(new char[]{'f', 'o'});
        badData.setEmail("fus");
        Response response = this.newPostRequest("auth/register", badData);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals("AuthController.register.arg0.email", errors.get(0).getPath());
        Assert.assertEquals("{org.hibernate.validator.constraints.Email.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.register.arg0.password", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("AuthController.register.arg0.username", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(2).getMessageTemplate());
    }

    @Test
    public void GETActivateHylkääPyynnönJosTarvittavatParametritPuuttuu() {
        Response response = this.newGetRequest("auth/activate");
        //
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("AuthController.activate.arg0", errors.get(0).getPath()); // key
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.activate.arg1", errors.get(1).getPath()); // email
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void GETActivateValidoiParametrit() {
        Response response = this.newGetRequest("auth/activate", t ->
            t.queryParam("key", "not-valid-key").queryParam("email", "foo")
        );
        //
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("AuthController.activate.arg0", errors.get(0).getPath()); // key
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.activate.arg1", errors.get(1).getPath()); // email
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void PUTUpdateCredentialsEiSalliNullArvoja() {
        UpdateCredentials nulls = new UpdateCredentials();
        nulls.setEmail(null);
        nulls.setPassword(null);
        nulls.setNewPassword(null); // tämä on ok, uusi salasana ei pakollinen
        Response response = this.newPutRequest("auth/update-credentials", nulls);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(2, errors.size());
        Assert.assertEquals("AuthController.updateCredentials.arg0.currentPassword", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.updateCredentials.arg0.email", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
    }

    @Test
    public void PUTUpdateCredentialsValidoiInputDatan() {
        UpdateCredentials badNewCredentials = new UpdateCredentials();
        badNewCredentials.setEmail("not-valid-email");
        badNewCredentials.setPassword(new char[]{'f', 'u'});
        badNewCredentials.setNewPassword(new char[]{'s'});
        Response response = this.newPutRequest("auth/update-credentials", badNewCredentials);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(3, errors.size());
        Assert.assertEquals("AuthController.updateCredentials.arg0.currentPassword", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.updateCredentials.arg0.email", errors.get(1).getPath());
        Assert.assertEquals("{org.hibernate.validator.constraints.Email.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("AuthController.updateCredentials.arg0.newPassword", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(2).getMessageTemplate());
    }
}
