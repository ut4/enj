package net.mdh.enj.auth;

import org.junit.Assert;
import org.junit.Test;
import org.junit.BeforeClass;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.validation.ValidationError;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.test.JerseyTest;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.client.Entity;
import java.util.Comparator;
import java.util.List;

public class AuthControllerTest extends JerseyTest {

    private static TokenService tokenService;
    private final char[] correctUsername = "foo".toCharArray();
    private final char[] correctPassword = "bars".toCharArray();

    @BeforeClass
    public static void beforeClass() {
        AuthControllerTest.tokenService = new TokenService();
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(AuthController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(AuthControllerTest.tokenService).to(TokenService.class);
                }
            });
    }

    @Test
    public void POSTloginValidoiInputDatan() {
        Response responseForNullInput;
        List<ValidationError> errorsForNullInput;
        Response responseForEmptyInput;
        List<ValidationError> errorsForEmptyInput;
        Response responseForBadInput;
        List<ValidationError> errorsForBadInput;

        // Tyhjä/null request data
        responseForNullInput = newLoginRequest(null);
        Assert.assertEquals(400, responseForNullInput.getStatus());
        errorsForNullInput = responseForNullInput.readEntity(new GenericType<List<ValidationError>>() {});
        Assert.assertEquals("AuthController.login.arg0", errorsForNullInput.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errorsForNullInput.get(0).getMessageTemplate());

        // Bean-validaatio, null
        LoginCredentials emptyData = new LoginCredentials();
        responseForEmptyInput = newLoginRequest(emptyData);
        Assert.assertEquals(400, responseForEmptyInput.getStatus());
        errorsForEmptyInput = responseForEmptyInput.readEntity(new GenericType<List<ValidationError>>() {});
        errorsForEmptyInput.sort(Comparator.comparing(ValidationError::getPath));// aakkosjärjestykseen
        Assert.assertEquals("AuthController.login.arg0.password", errorsForEmptyInput.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errorsForEmptyInput.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.login.arg0.username", errorsForEmptyInput.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errorsForEmptyInput.get(1).getMessageTemplate());

        // Bean-validaatio, liian lyhyet username&password-arvot
        LoginCredentials badData = new LoginCredentials();
        badData.setUsername(new char[]{'f'});
        badData.setPassword(new char[]{'f', 'o', 'o'});
        responseForBadInput = newLoginRequest(badData);
        Assert.assertEquals(400, responseForBadInput.getStatus());
        errorsForBadInput = responseForBadInput.readEntity(new GenericType<List<ValidationError>>() {});
        errorsForBadInput.sort(Comparator.comparing(ValidationError::getPath));// aakkosjärjestykseen
        Assert.assertEquals("AuthController.login.arg0.password", errorsForBadInput.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errorsForBadInput.get(0).getMessageTemplate());
        Assert.assertEquals("AuthController.login.arg0.username", errorsForBadInput.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errorsForBadInput.get(1).getMessageTemplate());
    }

    @Test
    public void POSTloginHylkääVääränPyynnönJosUsernameTaiSalasanaEiTäsmää() {
        Response responseForWrongUsername;
        // Väärä käyttäjänimi
        LoginCredentials dataWithWrongUsername = new LoginCredentials();
        dataWithWrongUsername.setUsername("doo".toCharArray());
        dataWithWrongUsername.setPassword(this.correctPassword);
        responseForWrongUsername = newLoginRequest(dataWithWrongUsername);
        Assert.assertEquals(401, responseForWrongUsername.getStatus());

        // Väärä salasana
        LoginCredentials dataWithWrongPassword = new LoginCredentials();
        dataWithWrongPassword.setUsername(this.correctUsername);
        dataWithWrongPassword.setPassword("dars".toCharArray());
        responseForWrongUsername = newLoginRequest(dataWithWrongPassword);
        Assert.assertEquals(401, responseForWrongUsername.getStatus());
    }

    @Test
    public void POSTloginPalauttaaOnnistuessaanUudenJsonWebTokenin() {
        LoginCredentials correctData = new LoginCredentials();
        correctData.setUsername(this.correctUsername);
        correctData.setPassword(this.correctPassword);
        Response response = newLoginRequest(correctData);
        Assert.assertEquals(200, response.getStatus());
        String token = response.readEntity(new GenericType<String>() {});
        Assert.assertTrue(AuthControllerTest.tokenService.isValid(token));
    }

    private Response newLoginRequest(LoginCredentials input) {
        return target("auth/login")
            .request(MediaType.APPLICATION_JSON_TYPE)
            .post(Entity.json(input));
    }
}
