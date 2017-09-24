package net.mdh.enj.auth;

import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.Assert;
import org.mockito.Mockito;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.MockHashingProvider;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

/**
 * Testaa AuthControllerin reitit /login, /logout, ja PUT /credentials.
 */
public class TestUserDependentAuthControllerTest extends AuthControllerTestCase {

    private final static String correctUsername = TestData.TEST_USER_NAME;
    private final static char[] correctPassword = TestData.TEST_USER_PASS.toCharArray();
    private final static char[] inCorrectPassword = "dars".toCharArray();
    private static String mockCurrentToken = "mocktokne";
    private static Long mockLastLogin = 3L;
    private static AuthUser testUser;

    @BeforeClass
    public static void beforeClass() {
        AuthControllerTestCase.beforeClass();
    }

    @Before
    public void beforeEach() {
        testUser = new AuthUser();
        testUser.setId(TestData.TEST_USER_ID);
        testUser.setUsername(correctUsername);
        testUser.setPasswordHash(String.valueOf(correctPassword));
        testUser.setLastLogin(mockLastLogin);
        testUser.setCurrentToken(mockCurrentToken);
        utils.update("UPDATE `user` SET " +
            "lastLogin = :lastLogin, currentToken = :currentToken," +
            "username = :username, passwordhash = :passwordHash, isActivated = 1 " +
            "WHERE id = :id", testUser);
    }

    @Test
    public void POSTLoginHylkääPyynnönJosKäyttäjääEiLöydy() {
        // Rakenna input
        LoginCredentials dataWithWrongUsername = new LoginCredentials();
        dataWithWrongUsername.setUsername("doo");
        dataWithWrongUsername.setPassword(correctPassword);
        // Tee pyyntö, ja assertoi ettei edennyt edes salasanan tarkistusvaiheeseen
        Response response = this.newPostRequest("auth/login", dataWithWrongUsername);
        Assert.assertEquals(401, response.getStatus());
        Mockito.verify(mockHasherSpy, Mockito.times(0)).verify(Mockito.any(), Mockito.any(String.class));
    }

    @Test
    public void POSTLoginHylkääPyynnönJosSalasanaOnVäärä() {
        Response responseForWrongPassword;
        // Rakenna input
        LoginCredentials dataWithWrongPassword = new LoginCredentials();
        dataWithWrongPassword.setUsername(correctUsername);
        dataWithWrongPassword.setPassword(inCorrectPassword);
        // Tee pyyntö, ja assertoi että tsekkasi salasanan
        responseForWrongPassword = this.newPostRequest("auth/login", dataWithWrongPassword);
        Assert.assertEquals(401, responseForWrongPassword.getStatus());
        Mockito.verify(mockHasherSpy, Mockito.times(1)).verify(inCorrectPassword, testUser.getPasswordHash());
    }

    @Test
    public void POSTloginHylkääPyynnönJosKäyttäjänTiliEiOleAktivoitu() {
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
        Mockito.verify(mockHasherSpy, Mockito.times(0)).verify(Mockito.any(), Mockito.any(String.class));
    }

    @Test
    public void POSTLoginOnnistuessaanPäivittääUudenJsonWebTokeninTietokantaanJaPalauttaaSenLoginResponsessa() {
        String mockToken = "fake-jwt";
        Mockito.when(mockTokenService.generateNew(testUser.getId())).thenReturn(mockToken);
        LoginCredentials correctData = new LoginCredentials();
        correctData.setUsername(correctUsername);
        correctData.setPassword(correctPassword);
        Response response = this.newPostRequest("auth/login", correctData);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö timestampin ja tokenin kantaan?
        AuthUser userDataAfter = this.getUserFromDb(testUser, false);
        Assert.assertNotEquals(testUser.getLastLogin(), userDataAfter.getLastLogin());
        Assert.assertEquals(mockToken, userDataAfter.getCurrentToken());
        // Palauttiko tokenin responsessa?
        Responses.LoginResponse loginResponse = response.readEntity(
            new GenericType<Responses.LoginResponse>() {}
        );
        Assert.assertEquals(mockToken, loginResponse.getToken());
    }

    @Test
    public void POSTLogoutPoistaaKirjautumistiedotTietokannasta() {
        // Tsekkaa kirjautumistiedot ennen logoutia
        AuthUser loginData = this.getUserFromDb(testUser, true);
        Assert.assertEquals(loginData.getLastLogin(), mockLastLogin);
        Assert.assertEquals(loginData.getCurrentToken(), mockCurrentToken);
        // Lähetä logout-pyyntö
        Response response = this.newPostRequest("auth/logout", null);
        Assert.assertEquals(200, response.getStatus());
        // Poistiko kirjautumistiedot?
        AuthUser loginDataAfter = this.getUserFromDb(testUser, true);
        Assert.assertNull(loginDataAfter.getLastLogin());
        Assert.assertNull(loginDataAfter.getCurrentToken());
    }

    @Test
    public void PUTUpdateCredentialsPäivittääKirjautuneenKäyttäjänTiedotTietokantaan() {
        UpdateCredentials newCredentials = new UpdateCredentials();
        char[] newPassword = "newpass".toCharArray();
        newCredentials.setUserId(testUser.getId());
        newCredentials.setUsername("newusername");
        newCredentials.setEmail("new@email.com");
        newCredentials.setPassword(testUser.getPasswordHash().toCharArray());
        newCredentials.setNewPassword(newPassword);
        // Lähetä PUT /auth/credentials
        Response response = this.newPutRequest("auth/credentials", newCredentials);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö tiedot?
        AuthUser testUserAfter = this.getUserFromDb(testUser, false);
        Assert.assertEquals(newCredentials.getUsername(), testUserAfter.getUsername());
        Assert.assertEquals(newCredentials.getEmail(), testUserAfter.getEmail());
        Assert.assertEquals(MockHashingProvider.genMockHash(newPassword),
            testUserAfter.getPasswordHash()
        );
    }

    @Test
    public void PUTUpdateCredentialsEiVaadiUuttaSalasanaa() {
        UpdateCredentials newCredentials = new UpdateCredentials();
        // note. ei userId:tä eikä newPassword:iä
        newCredentials.setUsername(testUser.getUsername());
        newCredentials.setEmail("new2@email.com");
        newCredentials.setPassword(testUser.getPasswordHash().toCharArray());
        // Lähetä PUT /auth/credentials
        Response response = this.newPutRequest("auth/credentials", newCredentials);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö tiedot?
        AuthUser testUserAfter = this.getUserFromDb(testUser, true);
        Assert.assertEquals(newCredentials.getEmail(), testUserAfter.getEmail());
        // Säilyikö muuttumattomat kentät ennallaan?
        Assert.assertEquals(testUser.getPasswordHash(), testUserAfter.getPasswordHash());
        Assert.assertEquals(testUser.getUsername(), testUserAfter.getUsername());
    }

    @Test
    public void PUTUpdateCredentialsHylkääPyynnönJosCredentialsitEiTäsmää() {
        UpdateCredentials newCredentials = new UpdateCredentials();
        newCredentials.setPassword(inCorrectPassword);
        newCredentials.setUserId(testUser.getId());
        newCredentials.setEmail(testUser.getEmail());
        Response response = this.newPutRequest("auth/credentials", newCredentials);
        Assert.assertEquals(400, response.getStatus());
    }
}
