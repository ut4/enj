package net.mdh.enj.auth;

import org.junit.Test;
import org.junit.Assert;
import org.mockito.Mockito;
import org.mockito.ArgumentCaptor;
import io.jsonwebtoken.impl.TextCodec;
import net.mdh.enj.resources.MockHashingProvider;
import javax.ws.rs.ProcessingException;
import javax.ws.rs.core.Response;

/**
 * Testaa AuthControllerin reitit /register, ja /activate.
 */
public class TestUserIndependentAuthControllerTest extends AuthControllerTestCase {

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
        try {
            this.newPostRequest("auth/register", this.getValidRegistrationCredentials(username));
            Assert.fail("Olisi pitänyt heittää poikkeus");
        } catch (ProcessingException e) {
            Assert.assertEquals(
                "Aktivointimailin lähetys epäonnistui",
                e.getCause().getMessage()
            );
            // Peruuttiko käyttäjän lisäyksen?
            AuthUser notExpectedUser = new AuthUser();
            notExpectedUser.setUsername(username);
            Assert.assertNull("Ei pitäisi kirjoittaa tietokantaan mitään",
                this.getUserFromDb(notExpectedUser, true)
            );
        }
    }

    @Test
    public void GETActivatePäivittääKäyttäjänAktiiviseksiJaTulostaaViestin() {
        // Rekisteröi jokin käyttäjä
        AuthUser testUser = insertNewUser("someuser", null, 0);
        // Lähetä GET /auth/activate?key={key}&email={email}
        Response response = sendActivationRequest(testUser);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö tiedot?
        AuthUser testUserAfter = this.getUserFromDb(testUser, false);
        Assert.assertEquals(1, testUserAfter.getIsActivated());
        Assert.assertNull(testUserAfter.getActivationKey());
        // Palauttiko viestin?
        String message = response.readEntity(String.class);
        Assert.assertTrue(message.contains("Tilisi on nyt aktivoitu"));
        Assert.assertTrue(message.contains(String.format(
            "%s#/kirjaudu",
            appConfig.appPublicFrontendUrl
        )));
    }

    @Test
    public void GETActivateEiKirjoitaTietokantaanMitäänJosKäyttäjääEiLöydy() {
        // Rekisteröi jokin käyttäjä
        AuthUser testUser = insertNewUser("afoo", null, 0);
        // Lähetä aktivointipyyntö, jossa väärä email
        testUser.setEmail("foaa@mail.com");
        try {
            this.sendActivationRequest(testUser);
            Assert.fail("Olisi pitänyt heittää poikkeus");
        } catch (ProcessingException e) {
            Assert.assertEquals(0,
                this.getUserFromDb(testUser, true).getIsActivated()
            );
        }
    }

    @Test
    public void GETActivateEiKirjoitaTietokantaanMitäänJosAvainEiTäsmää() {
        AuthUser testUser = insertNewUser("dr.pepper", null, 0);
        testUser.setActivationKey(mockActicavationKey.replace('a', 'b'));
        try {
            this.sendActivationRequest(testUser);
            Assert.fail("Olisi pitänyt heittää poikkeus");
        } catch (ProcessingException e) {
            Assert.assertEquals(0,
                this.getUserFromDb(testUser, true).getIsActivated()
            );
        }
    }

    @Test
    public void GETActivateEiKirjoitaTietokantaanMitäänJosAktivointiavainOnLiianVanha() {
        AuthUser testUser = insertNewUser(
            "mr.jackson",
            System.currentTimeMillis() / 1000 - AuthService.ACTIVATION_KEY_EXPIRATION - 100,
            0
        );
        try {
            this.sendActivationRequest(testUser);
            Assert.fail("Olisi pitänyt heittää poikkeus");
        } catch (ProcessingException e) {
            Assert.assertEquals(0,
                this.getUserFromDb(testUser, true).getIsActivated()
            );
        }
    }

    private Response sendActivationRequest(AuthUser testUser) {
        return this.newGetRequest("auth/activate", t ->
            t.queryParam("key", testUser.getActivationKey())
                .queryParam("email", TextCodec.BASE64URL.encode(testUser.getEmail()))
        );
    }
}
