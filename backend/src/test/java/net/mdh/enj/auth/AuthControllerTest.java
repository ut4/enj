package net.mdh.enj.auth;

import org.junit.Assert;
import org.junit.Test;
import org.mockito.Mockito;
import org.junit.BeforeClass;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.AppConfigProvider;
import net.mdh.enj.resources.MockHashingProvider;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.validation.ValidationError;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.List;

public class AuthControllerTest extends RollbackingDBJerseyTest {

    private final static String correctUsername = "foo";
    private final static char[] correctPassword = "bars".toCharArray();
    private static TokenService tokenService;
    private static HashingProvider mockHasherSpy;
    private static DbTestUtils utils;
    private static AuthUser testUser;
    private static String mockCurrentToken = "mocktokne";
    private static Long mockLastLogin = 3L;

    @BeforeClass
    public static void beforeClass() throws Exception {
        AuthControllerTest.tokenService = new TokenService(AppConfigProvider.getInstance());
        AuthControllerTest.mockHasherSpy = Mockito.spy(new MockHashingProvider());
        utils = new DbTestUtils(rollbackingDSFactory);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(AuthController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(AuthUserRepository.class).to(AuthUserRepository.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(mockHasherSpy).to(HashingProvider.class);
                    bind(AuthControllerTest.tokenService).to(TokenService.class);
                    bind(AuthService.class).to(AuthService.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                }
            });
    }

    @Test
    public void POSTloginValidoiInputDatan() {
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
    public void POSTloginHylkääPyynnönJosKäyttäjääEiLöydy() {
        Response responseForWrongUsername;
        // Rakenna input
        LoginCredentials dataWithWrongUsername = new LoginCredentials();
        dataWithWrongUsername.setUsername("doo");
        dataWithWrongUsername.setPassword(correctPassword);
        // Tee pyyntö, ja assertoi ettei edennyt edes salasanan tarkistusvaiheeseen
        responseForWrongUsername = this.newPostRequest("auth/login", dataWithWrongUsername);
        Assert.assertEquals(401, responseForWrongUsername.getStatus());
        Mockito.verify(mockHasherSpy, Mockito.times(0)).verify(Mockito.any(), Mockito.any(String.class));
    }

    @Test
    public void POSTloginHylkääPyynnönJosSalasanaOnVäärä() {
        setupTestUser();
        Response responseForWrongPassword;
        char[] wrongPassword = "dars".toCharArray();
        // Rakenna input
        LoginCredentials dataWithWrongPassword = new LoginCredentials();
        dataWithWrongPassword.setUsername(correctUsername);
        dataWithWrongPassword.setPassword(wrongPassword);
        // Tee pyyntö, ja assertoi että tsekkasi salasanan
        responseForWrongPassword = this.newPostRequest("auth/login", dataWithWrongPassword);
        Assert.assertEquals(401, responseForWrongPassword.getStatus());
        Mockito.verify(mockHasherSpy, Mockito.times(1)).verify(wrongPassword, testUser.getPasswordHash());
    }

    @Test
    public void POSTloginPalauttaaOnnistuessaanUudenJsonWebTokeninLoginResponsessa() {
        LoginCredentials correctData = new LoginCredentials();
        correctData.setUsername(correctUsername);
        correctData.setPassword(correctPassword);
        Response response = this.newPostRequest("auth/login", correctData);
        Assert.assertEquals(200, response.getStatus());
        Responses.LoginResponse loginResponse = response.readEntity(
            new GenericType<Responses.LoginResponse>() {}
        );
        Assert.assertTrue(AuthControllerTest.tokenService.isValid(loginResponse.getToken()));
    }

    @Test
    public void POSTLogoutPoistaaKirjautumistiedotTietokannasta() {
        setupTestUser();
        // Tsekkaa kirjautumistiedot ennen logoutia
        AuthUser loginData = this.getLoginData();
        Assert.assertEquals(loginData.getLastLogin(), mockLastLogin);
        Assert.assertEquals(loginData.getCurrentToken(), mockCurrentToken);
        // Lähetä logout-pyyntö
        Response response = this.newPostRequest("auth/logout", null);
        Assert.assertEquals(200, response.getStatus());
        // Poistiko kirjautumistiedot?
        AuthUser loginDataAfter = this.getLoginData();
        Assert.assertNull(loginDataAfter.getLastLogin());
        Assert.assertNull(loginDataAfter.getCurrentToken());
    }

    private void setupTestUser() {
        if (testUser == null) {
            testUser = new AuthUser();
            testUser.setId(TestData.TEST_USER_ID);
            testUser.setUsername(correctUsername);
            testUser.setPasswordHash(String.valueOf(correctPassword));
            testUser.setLastLogin(mockLastLogin);
            testUser.setCurrentToken(mockCurrentToken);
            utils.update("UPDATE `user` SET " +
                "lastLogin = :lastLogin, currentToken = :currentToken " +
            "WHERE id = :id", testUser);
        }
    }

    private AuthUser getLoginData() {
        return (AuthUser) utils.selectOneWhere("SELECT * FROM `user` WHERE id = :id",
            new BeanPropertySqlParameterSource(testUser),
            new SimpleMappers.AuthUserMapper()
        );
    }
}
