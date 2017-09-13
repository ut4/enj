package net.mdh.enj.auth;

import net.mdh.enj.Mailer;
import org.junit.Assert;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.junit.BeforeClass;
import io.jsonwebtoken.impl.TextCodec;
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
    private static Mailer mockMailer;
    private static DbTestUtils utils;
    private static AuthUser testUser;
    private static String mockCurrentToken = "mocktokne";
    private static Long mockLastLogin = 3L;

    @BeforeClass
    public static void beforeClass() throws Exception {
        AuthControllerTest.tokenService = new TokenService(AppConfigProvider.getInstance());
        AuthControllerTest.mockHasherSpy = Mockito.spy(new MockHashingProvider());
        AuthControllerTest.mockMailer = Mockito.mock(Mailer.class);
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
                    bind(mockMailer).to(Mailer.class);
                    bind(tokenService).to(TokenService.class);
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
        setupTestUser();
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
    public void POSTloginHylkääPyynnönJosKäyttäjänTiliEiOleAktivoitu() {
        setupTestUser();
        //
        AuthUser user = new AuthUser();
        user.setId(TestData.TEST_USER_ID);
        utils.update("UPDATE `user` SET isActivated = 0 WHERE id = :id", user);
        //
        LoginCredentials correctData = new LoginCredentials();
        correctData.setUsername(correctUsername);
        correctData.setPassword(correctPassword);
        Response response = this.newPostRequest("auth/login", correctData);
        Assert.assertEquals(401, response.getStatus());
    }

    @Test
    public void POSTloginPalauttaaOnnistuessaanUudenJsonWebTokeninLoginResponsessa() {
        setupTestUser();
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
        AuthUser loginData = this.getUserFromDb();
        Assert.assertEquals(loginData.getLastLogin(), mockLastLogin);
        Assert.assertEquals(loginData.getCurrentToken(), mockCurrentToken);
        // Lähetä logout-pyyntö
        Response response = this.newPostRequest("auth/logout", null);
        Assert.assertEquals(200, response.getStatus());
        // Poistiko kirjautumistiedot?
        AuthUser loginDataAfter = this.getUserFromDb();
        Assert.assertNull(loginDataAfter.getLastLogin());
        Assert.assertNull(loginDataAfter.getCurrentToken());
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
    public void POSTRegisterLisääKäyttäjänTietokantaanJaLähettääAktivointiEmailin() {
        RegistrationCredentials credentials = this.getValidRegistrationCredentials();
        AuthUser expectedNewUser = new AuthUser();
        expectedNewUser.setUsername(credentials.getUsername());
        expectedNewUser.setEmail(credentials.getEmail());
        expectedNewUser.setCreatedAt(System.currentTimeMillis() / 1000L);
        expectedNewUser.setPasswordHash(MockHashingProvider.genMockHash(credentials.getPassword()));
        //
        Mockito.when(mockMailer.sendMail(
            Mockito.eq(expectedNewUser.getEmail()),
            Mockito.anyString(),
            Mockito.anyString()
        )).thenReturn(true);
        // Lähetä register-pyyntö
        Response response = this.newPostRequest("auth/register", credentials);
        Assert.assertEquals(200, response.getStatus());
        // Lisäsikö käyttäjän?
        AuthUser actualUser = this.getUserFromDb(expectedNewUser);
        Assert.assertEquals(actualUser.getUsername(), expectedNewUser.getUsername());
        Assert.assertTrue(actualUser.getCreatedAt() >= expectedNewUser.getCreatedAt());
        Assert.assertEquals(actualUser.getEmail(), expectedNewUser.getEmail());
        Assert.assertEquals(actualUser.getPasswordHash(), expectedNewUser.getPasswordHash());
        Assert.assertNull(actualUser.getLastLogin());
        Assert.assertNull(actualUser.getCurrentToken());
        Assert.assertEquals(actualUser.getIsActivated(), 0);
        Assert.assertEquals(actualUser.getActivationKey().length(), 32);
        // Lähettikö mailin?
        final ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(mockMailer, Mockito.times(1)).sendMail(
            Mockito.eq(credentials.getEmail()),
            Mockito.anyString(), // subject
            captor.capture()     // content
        );
        Assert.assertTrue("Email pitäis alkaa näin",
            captor.getValue().startsWith("Moi " + credentials.getUsername() +
                ",<br><br>kiitos rekisteröitymisestä"
            )
        );
        Assert.assertTrue("Email pitäisi sisältää tilin aktivointilinkki",
            captor.getValue().matches(".+/api/auth/activate\\?key=.+&email=" +
                (TextCodec.BASE64URL.encode(credentials.getEmail())) + ".+"
            )
        );
    }

    @Test(expected = RuntimeException.class)
    public void POSTRegisterEiKirjoitaTietokantaanMitäänJosEmailinLähetysEpäonnistuu() {
        String username = "bos";
        // Tilanne, jossa mailer palauttaa false
        Mockito.when(mockMailer.sendMail(
            Mockito.anyString(),
            Mockito.anyString(),
            Mockito.anyString()
        )).thenReturn(false);
        // Lähetä register-pyyntö
        Response response = this.newPostRequest("auth/register", this.getValidRegistrationCredentials(username));
        Assert.assertEquals(500, response.getStatus());
        // Lisäsikö käyttäjän?
        AuthUser notExpectedUser = new AuthUser();
        notExpectedUser.setUsername(username);
        Assert.assertNull("Ei pitäisi kirjoittaa tietokantaan mitään",
            this.getUserFromDb(notExpectedUser)
        );
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
                "lastLogin = :lastLogin, currentToken = :currentToken," +
                "username = :username, passwordhash = :passwordHash " +
            "WHERE id = :id", testUser);
        }
    }

    private RegistrationCredentials getValidRegistrationCredentials() {
        return this.getValidRegistrationCredentials("myyrä");
    }
    private RegistrationCredentials getValidRegistrationCredentials(String username) {
        RegistrationCredentials credentials = new RegistrationCredentials();
        credentials.setUsername(username);
        credentials.setEmail(username + "@mail.com");
        credentials.setPassword((username + "pass").toCharArray());
        return credentials;
    }

    private AuthUser getUserFromDb() {
        return this.getUserFromDb(null);
    }
    private AuthUser getUserFromDb(AuthUser user) {
        return (AuthUser) utils.selectOneWhere(
            "SELECT * FROM `user` WHERE " + (user == null ? "id = :id" : "username = :username"),
            new BeanPropertySqlParameterSource(user == null ? testUser : user),
            new SimpleMappers.AuthUserMapper()
        );
    }
}
