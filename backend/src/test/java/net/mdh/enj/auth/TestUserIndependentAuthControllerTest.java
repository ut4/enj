package net.mdh.enj.auth;

import net.mdh.enj.workout.Workout;
import net.mdh.enj.program.Program;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.SimpleMappers;
import net.mdh.enj.resources.MockHashingProvider;
import static net.mdh.enj.exercise.ExerciseControllerTest.makeNewExerciseEntity;
import static net.mdh.enj.exercise.ExerciseControllerTest.makeNewExerciseVariantEntity;
import static net.mdh.enj.program.ProgramControllerTestCase.makeNewProgramEntity;
import static net.mdh.enj.program.ProgramControllerTestCase.makeNewProgramWorkoutEntity;
import static net.mdh.enj.program.ProgramControllerTestCase.makeNewProgramWorkoutExerciseEntity;
import static net.mdh.enj.workout.WorkoutControllerHandlersTest.makeNewWorkoutEntity;
import static net.mdh.enj.workout.WorkoutExerciseControllerHandlersTest.makeNewWorkoutExerciseEntity;
import static net.mdh.enj.workout.WorkoutExerciseSetControllerHandlersTest.makeNewWorkoutExerciseSetEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import io.jsonwebtoken.impl.TextCodec;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.junit.Assert;
import org.junit.Test;
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
    public void GETActivatePäivittääKäyttäjänAktiiviseksiJaTulostaaViestin() {
        // Rekisteröi jokin käyttäjä
        AuthUser testUser = insertNewUser("someuser", null, 0);
        // Lähetä GET /auth/activate?key={key}&email={email}
        Response response = this.sendActivationRequest(testUser);
        Assert.assertEquals(200, response.getStatus());
        // Päivittikö tiedot?
        AuthUser testUserAfter = this.getUserFromDb(testUser, false);
        Assert.assertEquals(1, testUserAfter.getIsActivated());
        Assert.assertNull(testUserAfter.getActivationKey());
        // Palauttiko viestin?
        String message = response.readEntity(String.class);
        Assert.assertTrue(message.contains("Tilisi on nyt aktivoitu"));
        Assert.assertTrue(message.contains(String.format(
            "%s/#/kirjaudu",
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
        testUser.setActivationKey(mockActivationKey.replace('a', 'b'));
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

    @Test
    public void DELETEPoistaaKirjautuneenKäyttäjän() {
        // Luo ensin poistettava käyttäjä
        AuthUser user = insertNewUser("DeleteTestUser1", null, 1);
        // Lähetä poistopyyntö
        TestData.testUserAwareRequestContext.setUserId(user.getId());
        Response response = this.newDeleteRequest("auth/" + user.getId());
        TestData.testUserAwareRequestContext.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(200, response.getStatus());
        // Poistiko käyttäjän?
        Assert.assertNull(this.getUserFromDb(user, false));
    }

    @Test
    public void DELETEPoistaaKirjautuneenKäyttäjänKaikkiTiedot() {
        //
        AuthUser user = insertNewUser("DeleteTestUser2", null, 1);
        // Luo liike & liikevariantti
        Exercise exercise = makeNewExerciseEntity("DeleteTestExercise", user.getId());
        utils.insertExercise(exercise);
        Exercise.Variant exerciseVariant = makeNewExerciseVariantEntity("DeleteTestExerciseVariant", exercise.getId(), user.getId());
        utils.insertExerciseVariant(exerciseVariant);
        // Luo ohjelma & ohjelmatreeni & ohjelmatreeniliike
        Program program = makeNewProgramEntity("DeleteTestProgram");
        program.setUserId(user.getId());
        utils.insertProgram(program);
        Program.Workout pw = makeNewProgramWorkoutEntity("DeleteTestPW", program.getId());
        utils.insertProgramWorkout(pw);
        Program.Workout.Exercise pwe = makeNewProgramWorkoutExerciseEntity(pw.getId(), exercise);
        utils.insertProgramWorkoutExercise(pwe);
        // Luo treeni & treeniliike & treeniliikesarja
        Workout workout = makeNewWorkoutEntity(user.getId());
        utils.insertWorkout(workout);
        Workout.Exercise workoutExercise = makeNewWorkoutExerciseEntity(workout.getId(), exercise.getId());
        utils.insertWorkoutExercise(workoutExercise);
        Workout.Exercise.Set wes = makeNewWorkoutExerciseSetEntity(workoutExercise.getId());
        utils.insertWorkoutExerciseSet(wes);
        // Lähetä poistopyyntö
        TestData.testUserAwareRequestContext.setUserId(user.getId());
        Response response = this.newDeleteRequest("auth/" + user.getId());
        TestData.testUserAwareRequestContext.setUserId(TestData.TEST_USER_ID);
        Assert.assertEquals(200, response.getStatus());
        // Poistiko kaikki tiedot?
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM program WHERE id = :programId",
            new MapSqlParameterSource("programId", program.getId()),
            new SimpleMappers.ProgramMapper()
        ));
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM programWorkout WHERE id = :programWorkoutId",
            new MapSqlParameterSource("programWorkoutId", pw.getId()),
            new SimpleMappers.ProgramWorkoutMapper()
        ));
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM programWorkoutExercise WHERE id = :programWorkoutExerciseId",
            new MapSqlParameterSource("programWorkoutExerciseId", pwe.getId()),
            new SimpleMappers.ProgramWorkoutExerciseMapper()
        ));
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM exercise WHERE id = :exerciseId",
            new MapSqlParameterSource("exerciseId", exercise.getId()),
            new SimpleMappers.ExerciseMapper()
        ));
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM exerciseVariant WHERE id = :exerciseVariantId",
            new MapSqlParameterSource("exerciseVariantId", exerciseVariant.getId()),
            new SimpleMappers.ExerciseVariantMapper()
        ));
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM workout WHERE id = :workoutId",
            new MapSqlParameterSource("workoutId", workout.getId()),
            new SimpleMappers.WorkoutMapper()
        ));
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM workoutExercise WHERE id = :workoutExerciseId",
            new MapSqlParameterSource("workoutExerciseId", workoutExercise.getId()),
            new SimpleMappers.WorkoutExerciseMapper()
        ));
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM workoutExerciseSet WHERE id = :workoutExerciseSetId",
            new MapSqlParameterSource("workoutExerciseSetId", wes.getId()),
            new SimpleMappers.WorkoutExerciseSetMapper()
        ));
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM bestSet WHERE workoutExerciseSetId = :workoutExerciseSetId",
            new MapSqlParameterSource("workoutExerciseSetId", wes.getId()),
            new SimpleMappers.WorkoutExerciseSetMapper()
        ));
        Assert.assertNull(this.getUserFromDb(user, false));
    }

    private Response sendActivationRequest(AuthUser testUser) {
        return this.newGetRequest("auth/activate", t ->
            t.queryParam("key", testUser.getActivationKey())
                .queryParam("email", TextCodec.BASE64URL.encode(testUser.getEmail()))
        );
    }
}
