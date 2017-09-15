package net.mdh.enj.auth;

import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.Assert;
import org.mockito.Mockito;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.MockHashingProvider;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.sql.SQLException;

/**
 * Testaa AuthControllerin reitit /login, /logout, ja /update-credentials.
 */
public class TestUserDependentAuthControllerTest extends AuthControllerTestCase {

    private final static String correctUsername = "foo";
    private final static char[] correctPassword = "bars".toCharArray();
    private static String mockCurrentToken = "mocktokne";
    private static Long mockLastLogin = 3L;
    private static AuthUser testUser;

    @BeforeClass
    public static void beforeClass() throws Exception {
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

    @After
    public void afterEach() throws SQLException {
        rollback();
    }

    @Test
    public void POSTLoginHylkääPyynnönJosKäyttäjääEiLöydy() {
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
    public void POSTLoginHylkääPyynnönJosSalasanaOnVäärä() {
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
        LoginCredentials correctData = new LoginCredentials();
        correctData.setUsername(correctUsername);
        correctData.setPassword(correctPassword);
        Response response = this.newPostRequest("auth/login", correctData);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö timestampin ja tokenin kantaan?
        AuthUser userDataAfter = this.getUserFromDb(testUser, false);
        Assert.assertNotEquals(testUser.getLastLogin(), userDataAfter.getLastLogin());
        Assert.assertNotEquals(testUser.getCurrentToken(), userDataAfter.getCurrentToken());
        // Palauttiko tokenin responsessa?
        Responses.LoginResponse loginResponse = response.readEntity(
            new GenericType<Responses.LoginResponse>() {}
        );
        Assert.assertTrue(TestUserDependentAuthControllerTest.tokenService.isValid(loginResponse.getToken()));
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
        newCredentials.setEmail("new@email.com");
        newCredentials.setPassword(testUser.getPasswordHash().toCharArray());
        newCredentials.setNewPassword(newPassword);
        // Lähetä PUT /auth/update-credentials
        Response response = this.newPutRequest("auth/update-credentials", newCredentials);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö tiedot?
        AuthUser testUserAfter = this.getUserFromDb(testUser, true);
        Assert.assertEquals(newCredentials.getEmail(), testUserAfter.getEmail());
        Assert.assertEquals(MockHashingProvider.genMockHash(newPassword),
            testUserAfter.getPasswordHash()
        );
    }
}
