package net.mdh.enj.auth;

import org.junit.Test;
import org.junit.Before;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.mockito.Mockito;
import org.mockito.ArgumentCaptor;
import io.jsonwebtoken.impl.TextCodec;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.MockHashingProvider;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;

/**
 * Testaa AuthControllerin reitit /login, /logout, /register, /request-password-reset,
 * PUT /password, ja PUT /credentials.
 */
public class TestUserDependentAuthControllerTest extends AuthControllerTestCase {

    private final static String correctUsername = "bar";
    private final static String correctEmail = "bar@bar.com";
    private final static char[] correctPassword = "bars".toCharArray();
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
        testUser.setEmail(correctEmail);
        testUser.setPasswordHash(String.valueOf(correctPassword));
        testUser.setLastLogin(mockLastLogin);
        testUser.setCurrentToken(mockCurrentToken);
        utils.update("UPDATE `user` SET " +
            "email = :email, lastLogin = :lastLogin, currentToken = :currentToken," +
            "username = :username, passwordhash = :passwordHash, isActivated = 1, " +
            "passwordResetKey = NULL, passwordResetTime = NULL " +
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
            Mockito.eq(expectedNewUser.getUsername()),
            Mockito.anyString(),
            Mockito.anyString()
        )).thenReturn(true);
        String mockActivationKey = "fake-random-chars";
        Mockito.when(mockTokenService.generateRandomString(AuthService.ACTIVATION_KEY_LENGTH))
            .thenReturn(mockActivationKey);
        // Lähetä register-pyyntö
        Response response = this.newPostRequest("auth/register", credentials);
        Assert.assertEquals(200, response.getStatus());
        // Lisäsikö käyttäjän?
        AuthUser actualUser = this.getUserFromDb(expectedNewUser, true);
        Assert.assertEquals(expectedNewUser.getUsername(), actualUser.getUsername());
        Assert.assertTrue(actualUser.getCreatedAt() >= expectedNewUser.getCreatedAt());
        Assert.assertEquals(expectedNewUser.getEmail(), actualUser.getEmail());
        Assert.assertEquals(expectedNewUser.getPasswordHash(), actualUser.getPasswordHash());
        Assert.assertNull(actualUser.getLastLogin());
        Assert.assertNull(actualUser.getCurrentToken());
        Assert.assertEquals(0, actualUser.getIsActivated());
        Assert.assertEquals(mockActivationKey, actualUser.getActivationKey());
        // Lähettikö mailin?
        final ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(mockMailer, Mockito.times(1)).sendMail(
            Mockito.eq(credentials.getEmail()),
            Mockito.eq(credentials.getUsername()),
            Mockito.anyString(), // subject
            captor.capture()     // content
        );
        Assert.assertTrue("Email pitäis alkaa näin",
            captor.getValue().startsWith("Moi " + credentials.getUsername() +
                ",<br><br>kiitos rekisteröitymisestä"
            )
        );
        Assert.assertTrue(
            "Email pitäisi sisältää tilin aktivointilinkki",
            captor.getValue().contains(String.format(
                "%s/auth/activate?key=%s&email=%s",
                appConfig.appPublicBackendUrl,
                mockActivationKey,
                (TextCodec.BASE64URL.encode(credentials.getEmail()))
            ))
        );
    }

    @Test
    public void POSTRegisterPalauttaaVirhekoodinJosKäyttäjänimiTaiEmailOnJoKäytössä() {
        RegistrationCredentials newCredentials = new RegistrationCredentials();
        newCredentials.setUsername(testUser.getUsername());
        newCredentials.setEmail(testUser.getEmail());
        newCredentials.setPassword("foss".toCharArray());
        // Lähetä POST /auth/register
        Response response = this.newPostRequest("auth/register", newCredentials);
        Assert.assertEquals(400, response.getStatus());
        // Sisältääkö virhekoodit?
        String errorNames = response.readEntity(String.class);
        Assert.assertTrue(errorNames.contains(AuthService.ERRORNAME_RESERVED_EMAIL));
        Assert.assertTrue(errorNames.contains(AuthService.ERRORNAME_RESERVED_USERNAME));
    }

    @Test
    public void POSTRegisterEiKirjoitaTietokantaanMitäänJosEmailinLähetysEpäonnistuu() {
        String username = "bos";
        // Tilanne, jossa mailer epäonnistuu
        Mockito.when(mockMailer.sendMail(
            Mockito.anyString(), // toAddress
            Mockito.anyString(), // toPersonal
            Mockito.anyString(), // subject
            Mockito.anyString()  // content
        )).thenReturn(false);
        // Lähetä register-pyyntö
        Response response = this.newPostRequest("auth/register", this.getValidRegistrationCredentials(username));
        // Failasiko?
        Assert.assertEquals(500, response.getStatus());
        Assert.assertTrue(response.readEntity(String.class).contains(AuthService.ERRORNAME_MAIL_FAILURE));
        // Peruuttiko käyttäjän lisäyksen?
        AuthUser notExpectedUser = new AuthUser();
        notExpectedUser.setUsername(username);
        Assert.assertNull("Ei pitäisi kirjoittaa tietokantaan mitään",
            this.getUserFromDb(notExpectedUser, true)
        );
    }

    @Test
    public void POSTRequestPasswordResetPäivittääResetointilinkinTietokantaanJaLähettääSenEmailillaKäyttäjälle() {
        // Setup
        Mockito.when(mockMailer.sendMail(
            Mockito.eq(testUser.getEmail()),
            Mockito.eq(testUser.getUsername()),
            Mockito.anyString(),
            Mockito.anyString()
        )).thenReturn(true);
        String mockKey = "fake-random-chars";
        Mockito.when(mockTokenService.generateRandomString(AuthService.PASSWORD_RESET_KEY_LENGTH))
            .thenReturn(mockKey);
        // Lähetä pyyntö
        EmailCredentials postData = new EmailCredentials();
        postData.setEmail(testUser.getEmail());
        long unixTimeBeforeRequest = System.currentTimeMillis() / 1000L;
        Response response = this.newPostRequest("auth/request-password-reset", postData);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö avaimen tietokantaan?
        AuthUser userAfterRequest = this.getUserFromDb(testUser, false);
        Assert.assertEquals(mockKey, userAfterRequest.getPasswordResetKey());
        Assert.assertTrue(userAfterRequest.getPasswordResetTime() >= unixTimeBeforeRequest);
        // Lähettikö mailin?
        final ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        Mockito.verify(mockMailer, Mockito.times(1)).sendMail(
            Mockito.eq(testUser.getEmail()),
            Mockito.eq(testUser.getUsername()),
            Mockito.anyString(), // subject
            captor.capture()     // content
        );
        String actualEmail = captor.getValue();
        Assert.assertTrue("Email pitäis alkaa näin",
            actualEmail.startsWith("Moi " + testUser.getUsername() +
                ",<br><br>voit luoda uuden salasanan tästä"
            )
        );
        Assert.assertTrue(
            "Email pitäisi sisältää linkki salasanan palautussivulle",
            actualEmail.contains(String.format(
                "%s#/tili/uusi-salasana/%s/%s",
                appConfig.appPublicFrontendUrl,
                mockKey,
                (TextCodec.BASE64URL.encode(postData.getEmail()))
            ))
        );
    }

    @Test
    public void POSTRequestPasswordResetHylkääPyynnönJosKäyttäjääEiLöydy() {
        EmailCredentials invalid = new EmailCredentials();
        invalid.setEmail("not@found.biz");
        //
        Response response = this.newPostRequest("auth/request-password-reset", invalid);
        Assert.assertEquals(400, response.getStatus());
        Assert.assertTrue(response.readEntity(String.class).contains(AuthService.ERRORNAME_USER_NOT_FOUND));
    }

    @Test
    public void POSTRequestPasswordResetEiKirjoitaTietokantaanMitäänJosEmailinLähetysEpäonnistuu() {
        // Tilanne, jossa emailin lähetys epäonnistuu
        Mockito.when(mockMailer.sendMail(
            Mockito.anyString(), // toAddress
            Mockito.anyString(), // toPersonal
            Mockito.anyString(), // subject
            Mockito.anyString()  // content
        )).thenReturn(false);
        // Lähetä pyyntö
        EmailCredentials postData = new EmailCredentials();
        postData.setEmail(testUser.getEmail());
        Response response = this.newPostRequest("auth/request-password-reset", postData);
        // Failasiko?
        Assert.assertEquals(500, response.getStatus());
        Assert.assertTrue(response.readEntity(String.class).contains(AuthService.ERRORNAME_MAIL_FAILURE));
        // Jättikö avaimen kirjoittamatta tietokantaan?
        AuthUser userDataAfter = this.getUserFromDb(testUser, true);
        Assert.assertNull(userDataAfter.getPasswordResetKey());
        Assert.assertNull(userDataAfter.getPasswordResetTime());
    }

    @Test
    public void PUTPasswordKirjoittaaUudenSalasananJaTyhjentääResetointiAvaimenTietokantaan() {
        String correctResetKey = setPasswordResetKey();
        //
        NewPasswordCredentials inputData = new NewPasswordCredentials();
        inputData.setEmail(testUser.getEmail());
        inputData.setNewPassword("newpass".toCharArray());
        inputData.setPasswordResetKey(correctResetKey);
        // Lähetä PUT /auth/password
        Response response = this.newPutRequest("auth/password", inputData);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö salasanan & tyhjensikö avaimen?
        AuthUser testUserAfter = this.getUserFromDb(testUser, false);
        Assert.assertNull(testUserAfter.getPasswordResetKey());
        Assert.assertNull(testUserAfter.getPasswordResetTime());
        Assert.assertEquals(MockHashingProvider.genMockHash(inputData.getNewPassword()),
            testUserAfter.getPasswordHash()
        );
    }

    @Test
    public void PUTPasswordEiKirjoitaTietokantaanMitäänJosResetointiAvainEiTäsmää() {
        //
        NewPasswordCredentials inputData = new NewPasswordCredentials();
        inputData.setEmail(testUser.getEmail());
        inputData.setNewPassword("newpass".toCharArray());
        inputData.setPasswordResetKey(mockActivationKey.replace("a", "b"));
        // Lähetä PUT /auth/password
        Response response = this.newPutRequest("auth/password", inputData);
        Assert.assertEquals(400, response.getStatus());
        // Skippasiko tietokantaan kirjoituksen?
        AuthUser testUserAfter = this.getUserFromDb(testUser, false);
        Assert.assertEquals(testUser.getPasswordHash(), testUserAfter.getPasswordHash());
    }

    @Test
    public void PUTPasswordEiKirjoitaTietokantaanMitäänJosEmailEiTäsmää() {
        String correctResetKey = setPasswordResetKey();
        //
        NewPasswordCredentials inputData = new NewPasswordCredentials();
        inputData.setEmail("does@not.match");
        inputData.setNewPassword("newpass".toCharArray());
        inputData.setPasswordResetKey(correctResetKey);
        // Lähetä PUT /auth/password
        Response response = this.newPutRequest("auth/password", inputData);
        Assert.assertEquals(400, response.getStatus());
        // Skippasiko tietokantaan kirjoituksen?
        AuthUser testUserAfter = this.getUserFromDb(testUser, false);
        Assert.assertEquals(testUser.getPasswordHash(), testUserAfter.getPasswordHash());
        Assert.assertEquals(correctResetKey, testUserAfter.getPasswordResetKey());
    }

    @Test
    public void PUTPasswordEiKirjoitaTietokantaanMitäänJosAvainOnLiianVanha() {
        String correctResetKey = setPasswordResetKey(
            System.currentTimeMillis() / 1000L - AuthService.PASSWORD_RESET_KEY_EXPIRATION - 10
        );
        //
        NewPasswordCredentials inputData = new NewPasswordCredentials();
        inputData.setEmail(testUser.getEmail());
        inputData.setNewPassword("newpass".toCharArray());
        inputData.setPasswordResetKey(correctResetKey);
        // Lähetä PUT /auth/password
        Response response = this.newPutRequest("auth/password", inputData);
        Assert.assertEquals(400, response.getStatus());
        // Skippasiko tietokantaan kirjoituksen?
        AuthUser testUserAfter = this.getUserFromDb(testUser, false);
        Assert.assertEquals(testUser.getPasswordHash(), testUserAfter.getPasswordHash());
        Assert.assertEquals(correctResetKey, testUserAfter.getPasswordResetKey());
    }

    @Test
    public void PUTCredentialsPäivittääKirjautuneenKäyttäjänTiedotTietokantaan() {
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
    public void PUTCredentialsEiVaadiUuttaSalasanaa() {
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
    public void PUTCredentialsPalauttaaVirhekoodinJosUusiKäyttäjänimiTaiEmailOnJoKäytössä() {
        AuthUser existing = new AuthUser();
        existing.setUsername("taken");
        existing.setEmail("taken@fus.ro");
        existing.setPasswordHash("fooo");
        existing.setIsActivated(1);
        utils.insertAuthUser(existing);
        // Sama käyttäjänimi
        // ---------------------------------------------------------------------
        UpdateCredentials newCredentials = new UpdateCredentials();
        newCredentials.setUserId(testUser.getId());
        newCredentials.setUsername(existing.getUsername());
        newCredentials.setEmail(testUser.getEmail());
        newCredentials.setPassword(testUser.getPasswordHash().toCharArray());
        // Lähetä PUT /auth/credentials
        Response response = this.newPutRequest("auth/credentials", newCredentials);
        Assert.assertEquals(400, response.getStatus());
        // Sisältääkö virhekoodin?
        String errorNames = response.readEntity(String.class);
        Assert.assertTrue(errorNames.contains(AuthService.ERRORNAME_RESERVED_USERNAME));
        // Sama email
        // ---------------------------------------------------------------------
        UpdateCredentials newCredentials2 = new UpdateCredentials();
        newCredentials2.setUserId(testUser.getId());
        newCredentials2.setUsername(testUser.getUsername());
        newCredentials2.setEmail(existing.getEmail());
        newCredentials2.setPassword(testUser.getPasswordHash().toCharArray());
        // Lähetä PUT /auth/credentials
        Response response2 = this.newPutRequest("auth/credentials", newCredentials2);
        Assert.assertEquals(400, response2.getStatus());
        // Sisältääkö virhekoodin?
        String errorNames2 = response2.readEntity(String.class);
        Assert.assertTrue(errorNames2.contains(AuthService.ERRORNAME_RESERVED_EMAIL));
    }

    @Test
    public void PUTCredentialsHylkääPyynnönJosCredentialsitEiTäsmää() {
        UpdateCredentials newCredentials = new UpdateCredentials();
        newCredentials.setPassword(inCorrectPassword);
        newCredentials.setUserId(testUser.getId());
        newCredentials.setEmail(testUser.getEmail());
        Response response = this.newPutRequest("auth/credentials", newCredentials);
        Assert.assertEquals(400, response.getStatus());
    }

    private static String setPasswordResetKey() {
        return setPasswordResetKey(System.currentTimeMillis() / 1000L - 10);
    }
    private static String setPasswordResetKey(long requestesAtUnixTime) {
        String mockKey = mockActivationKey; // voi käyttää tätä, koska sama pituus
        testUser.setPasswordResetKey(mockKey);
        testUser.setPasswordResetTime(requestesAtUnixTime);
        utils.update("UPDATE `user` SET passwordResetKey = :passwordResetKey," +
            "passwordResetTime = :passwordResetTime", testUser);
        return mockKey;
    }
}
