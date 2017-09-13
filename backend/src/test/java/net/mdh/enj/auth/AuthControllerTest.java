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
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.Collections;

public class AuthControllerTest extends RollbackingDBJerseyTest {

    private final static String correctUsername = "foo";
    private final static char[] correctPassword = "bars".toCharArray();
    private static TokenService tokenService;
    private static HashingProvider mockHasherSpy;
    private static Mailer mockMailer;
    private static DbTestUtils utils;
    private static AuthUser testUser;
    private static String mockCurrentToken = "mocktokne";
    private static String mockActicavationKey = String.join("", Collections.nCopies(
        AuthService.ACTIVATION_KEY_LENGTH, "a"
    ));
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
        Assert.assertEquals(actualUser.getActivationKey().length(),
            AuthService.ACTIVATION_KEY_LENGTH
        );
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

    @Test
    public void GETActivatePäivittääKäyttäjänAktiiviseksi() {
        // Rekisteröi jokin käyttäjä
        AuthUser testUser = insertNewUnactivatedUser("someuser", null);
        // Lähetä GET /auth/activate?key={key}&email={email}
        Response response = sendActivationRequest(testUser);
        Assert.assertEquals(200, response.getStatus());
        Assert.assertTrue(response.readEntity(String.class).contains("Tilisi on nyt aktivoitu"));
        // Päivittikö tiedot?
        AuthUser testUserAfter = this.getUserFromDb(testUser);
        Assert.assertEquals(testUserAfter.getIsActivated(), 1);
        Assert.assertNull(testUserAfter.getActivationKey());
    }

    @Test(expected = RuntimeException.class)
    public void GETActivateEiKirjoitaTietokantaanMitäänJosKäyttäjääEiLöydy() {
        // Lähetä aktivointipyyntö, jossa väärä email
        Response response = this.newGetRequest("auth/activate", t ->
            t.queryParam("key", mockActicavationKey).queryParam("email", "Zm9vQGJhci5jb20=") // foo@bar.com
        );
        Assert.assertEquals(500, response.getStatus());
    }

    @Test(expected = RuntimeException.class)
    public void GETActivateEiKirjoitaTietokantaanMitäänJosAvainEiTäsmää() {
        AuthUser testUser = insertNewUnactivatedUser("dr.pepper", null);
        testUser.setActivationKey(mockActicavationKey);
        Response response = sendActivationRequest(testUser);
        Assert.assertEquals(500, response.getStatus());
    }

    @Test(expected = RuntimeException.class)
    public void GETActivateEiKirjoitaTietokantaanMitäänJosAktivointiavainOnLiianVanha() {
        AuthUser testUser = insertNewUnactivatedUser(
            "mr.jackson",
            System.currentTimeMillis() / 1000 - AuthService.ACTIVATION_KEY_EXPIRATION - 100
        );
        Response response = sendActivationRequest(testUser);
        Assert.assertEquals(500, response.getStatus());
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

    private AuthUser insertNewUnactivatedUser(String username, Long createdAt) {
        RegistrationCredentials credentials = this.getValidRegistrationCredentials(username);
        AuthUser testUser = new AuthUser();
        testUser.setUsername(credentials.getUsername());
        testUser.setEmail(credentials.getEmail());
        testUser.setCreatedAt(createdAt == null ? System.currentTimeMillis() / 1000L : createdAt);
        testUser.setPasswordHash("foo");
        testUser.setActivationKey(tokenService.generateRandomString(AuthService.ACTIVATION_KEY_LENGTH));
        utils.insertAuthUser(testUser);
        return testUser;
    }
    private Response sendActivationRequest(AuthUser testUser) {
        return this.newGetRequest("auth/activate", t ->
            t.queryParam("key", testUser.getActivationKey())
                .queryParam("email", TextCodec.BASE64URL.encode(testUser.getEmail()))
        );
    }
}
