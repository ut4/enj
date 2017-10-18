package net.mdh.enj.program;

import net.mdh.enj.api.Responses;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.SimpleMappers;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.junit.Assert;
import org.junit.Test;
import javax.ws.rs.ProcessingException;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.Collections;
import java.util.Arrays;
import java.util.List;

public class ProgramControllerProgramHandlersTest extends ProgramControllerTestCase {

    private static Program testProgram;
    private static Program.Workout testProgramWorkout;

    @Test
    public void POSTInsertoiUudenOhjelmanJaOhjelmatreenitTietokantaanKirjautuneelleKäyttäjälle() {
        // Luo testiohjelma, ja sille yksi ohjelmatreeni. NOTE - ei userId:tä
        Program program = makeNewProgramEntity("My program");
        Program.Workout programWorkout = new Program.Workout();
        programWorkout.setName("Leg day");
        programWorkout.setOrdinal(1);
        programWorkout.setOccurrences(Arrays.asList(
            new Program.Workout.Occurrence(1, 0, null), // Ma, alkaa vk:sta 0, ei toistu
            new Program.Workout.Occurrence(3, 0, null) // Pe, alkaa vk:sta 0, ei toistu
        ));
        Exercise testExercise = new Exercise();
        testExercise.setName("ProgramPOSTTestExercise");
        utils.insertExercise(testExercise);
        programWorkout.setExercises(Collections.singletonList(makeNewProgramWorkoutExerciseEntity(null, testExercise)));
        List<Program.Workout> programWorkouts = Collections.singletonList(programWorkout);
        program.setWorkouts(programWorkouts);
        //
        Response response = this.newPostRequest("program", program);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        // Insertoiko ohjelman?
        Program actualProgram = (Program) utils.selectOneWhere(
            "SELECT * FROM program WHERE id = :id",
            new MapSqlParameterSource("id", responseBody.insertId),
            new SimpleMappers.ProgramMapper()
        );
        program.setId(responseBody.insertId);
        program.setUserId(TestData.TEST_USER_ID);
        program.setWorkouts(null);
        Assert.assertEquals(program.toString(), actualProgram.toString());
        // Insertoiko ohjelmatreenin?
        List actualProgramWorkouts = utils.selectAllWhere(
            "SELECT * FROM programWorkout WHERE programId = :programId",
            new MapSqlParameterSource("programId", actualProgram.getId()),
            new SimpleMappers.ProgramWorkoutMapper()
        );
        Assert.assertEquals(1, actualProgramWorkouts.size());
        Program.Workout actualProgramWorkout = (Program.Workout) actualProgramWorkouts.get(0);
        programWorkout.setProgramId(actualProgram.getId());
        programWorkout.setId(actualProgramWorkout.getId());
        Assert.assertEquals(
            programWorkouts.get(0).toString(),
            actualProgramWorkout.toString()
        );
        // Insertoiko ohjelmatreeniliikkeen?
        List actualProgramWorkoutExercises = utils.selectAllWhere(
            "SELECT * FROM programWorkoutExercise WHERE programWorkoutId = :pwId",
            new MapSqlParameterSource("pwId", actualProgramWorkout.getId()),
            new SimpleMappers.ProgramWorkoutExerciseMapper()
        );
        Assert.assertEquals(1, actualProgramWorkoutExercises.size());
        Program.Workout.Exercise actualPwe = (Program.Workout.Exercise) actualProgramWorkoutExercises.get(0);
        Assert.assertEquals(testExercise.getId(), actualPwe.getExerciseId());
        Assert.assertNull(actualPwe.getExerciseVariantId());
    }

    @Test
    public void POSTInsertEiKirjoitaOhjelmaaTietokantaanJosOhjelmatreeninLisäysEpäonnistuu() {
        //
        Program program = makeNewProgramEntity("Fyy");
        Program.Workout programWorkout = new Program.Workout();
        programWorkout.setName("Fyy daa");
        programWorkout.setOccurrences(Collections.singletonList(
            new Program.Workout.Occurrence(1, 0, null)
        ));
        programWorkout.setOrdinal(256); // Pitäisi aiheuttaa Out of range -error (max 255)
        List<Program.Workout> programWorkouts = Collections.singletonList(programWorkout);
        program.setWorkouts(programWorkouts);
        //
        try {
            this.newPostRequest("program", program);
            Assert.fail("Olisi pitänyt heittää poikkeus");
        } catch (ProcessingException e) {
            // Peruuttiko ohjelman insertoinnin?
            Assert.assertNull(utils.selectOneWhere(
                "SELECT * FROM program WHERE `name` = :name",
                new MapSqlParameterSource("name", program.getName()),
                new SimpleMappers.ProgramMapper()
            ));
        }
    }

    @Test
    public void GETReititLiittääPalautettuunOhjelmaanOhjelmatreenitJaliikkeet() {
        // Insertoi testiohjelma, sille yksi ohjelmatreeni, ja sille yksi liike
        insertMainGETTestData();
        // Lähetä pyyntö
        Response response = newGetRequest("program/mine");
        Assert.assertEquals(200, response.getStatus());
        // Palauttiko ohjelman relaatioineen?
        List<Program> actualMyPrograms = response.readEntity(new GenericType<List<Program>>() {});
        Program actualMyProgramsProgram = findProgram(actualMyPrograms, testProgram.getId());
        Assert.assertEquals(
            testProgramWorkout.toString(),
            actualMyProgramsProgram.getWorkouts().get(0).toString()
        );
        Assert.assertEquals(
            testProgramWorkout.getExercises().get(0).toString(),
            actualMyProgramsProgram.getWorkouts().get(0).getExercises().get(0).toString()
        );
    }

    @Test
    public void GETMineJaGETProgramIdPalauttaaVainKirjautuneelleKäyttäjälleKuuluviaOhjelmia() {
        // Insertoi kaksi testiohjelmaa, joista toinen kuuluu toiselle käyttäjälle
        insertMainGETTestData();
        Program notMyProgram = insertTestData("Not my program", TestData.TEST_USER_ID2);
        // -- GET program/mine -----------------------------
        Response response = newGetRequest("program/mine");
        Assert.assertEquals(200, response.getStatus());
        List<Program> actualMyPrograms = response.readEntity(new GenericType<List<Program>>() {});
        // Palauttiko vain kirjautuneen käyttäjän ohjelmat?
        Program actualMyProgramsProgram = actualMyPrograms.stream()
            .filter(p -> p.getId().equals(testProgram.getId()))
            .findFirst().orElse(null);
        Assert.assertNotNull("Pitäisi sisältää kirjautuneen käyttäjän ohjelma",
            actualMyProgramsProgram
        );
        Assert.assertEquals(1, actualMyProgramsProgram.getWorkouts().size());
        Assert.assertEquals(
            testProgram.getWorkouts().toString(),
            actualMyProgramsProgram.getWorkouts().toString()
        );
        Assert.assertFalse("Ei pitäisi sisältää toisen käyttäjän ohjelmaa",
            actualMyPrograms.stream().anyMatch(p -> p.getId().equals(notMyProgram.getId()))
        );
        // -- GET program/{programId} ----------------------------------
        Response response2 = newGetRequest("program/" + testProgram.getId());
        Assert.assertEquals(200, response2.getStatus());
        Program actualMyProgram = response2.readEntity(new GenericType<Program>() {});
        Assert.assertEquals(testProgram, actualMyProgram);
        Assert.assertEquals(1, actualMyProgram.getWorkouts().size());
        Assert.assertEquals(
            testProgram.getWorkouts().toString(),
            actualMyProgram.getWorkouts().toString()
        );
        Response response3 = newGetRequest("program/" + notMyProgram.getId());
        Assert.assertEquals(204, response3.getStatus());
    }

    @Test
    public void PUTPäivittääOhjelmanTietokantaan() {
        // Luo ensin testiohjelma.
        Program program = makeNewProgramEntity("Inserted");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        program.setWorkouts(Collections.singletonList(makeNewProgramWorkoutEntity("foo", program.getId())));
        // Muuta sen tietoja
        program.setName("Updated");
        program.setStart(program.getStart() + 1);
        program.setEnd(program.getEnd() + 1);
        program.setDescription(null);
        program.setUserId(TestData.TEST_USER_ID2); // Ei pitäisi tallentaa tätä
        // PUTtaa muutetut tiedot
        Response response = this.newPutRequest("program/" + program.getId(), program);
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 1", (Integer)1, responseBody.updateCount);
        // Päivittikö muutetut tiedot kantaan?
        Program actualProgram = (Program) utils.selectOneWhere(
            "SELECT * FROM program WHERE id = :id",
            new MapSqlParameterSource("id", program.getId()),
            new SimpleMappers.ProgramMapper()
        );
        Assert.assertEquals(program.getName(), actualProgram.getName());
        Assert.assertEquals(program.getStart(), actualProgram.getStart());
        Assert.assertEquals(program.getEnd(), actualProgram.getEnd());
        Assert.assertNull(actualProgram.getDescription());
        Assert.assertEquals("Ei pitäisi tallentaa muutettua userId:tä",
            TestData.TEST_USER_ID, actualProgram.getUserId()
        );
    }

    @Test
    public void DELETEPoistaaOhjelmanOhjelmatreeneineenJaLiikkeineenTietokannasta() {
        // Luo poistettava ohjelma.
        Program program = makeNewProgramEntity("Deletable");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        Program.Workout programWorkout = makeNewProgramWorkoutEntity("Workout of deletable", program.getId());
        utils.insertProgramWorkout(programWorkout);
        Exercise testExercise = new Exercise();
        testExercise.setName("DELETEProgramTestExercise");
        utils.insertExercise(testExercise);
        utils.insertProgramWorkoutExercise(makeNewProgramWorkoutExerciseEntity(programWorkout.getId(), testExercise));
        // Lähetä DELETE-pyyntö
        Response response = this.newDeleteRequest("program/" + program.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 1", (Integer)1, responseBody.deleteCount);
        // Poistiko ohjelman kannasta?
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM program WHERE id = :id",
            new MapSqlParameterSource("id", program.getId()),
            new SimpleMappers.ProgramMapper()
        ));
    }

    @Test
    public void DELETEEiPoistaToiselleKäyttäjälleKuuluvaaOhjelmaa() {
        // Luo testidata.
        Program program = makeNewProgramEntity("notMineToDelete");
        program.setUserId(TestData.TEST_USER_ID2);
        utils.insertProgram(program);
        // Lähetä DELETE-pyyntö
        Response response = this.newDeleteRequest("program/" + program.getId());
        Assert.assertEquals(400, response.getStatus());
        // Jättikö tiedot rauhaan?
        Assert.assertNotNull(utils.selectOneWhere(
            "SELECT * FROM program WHERE id = :id",
            new MapSqlParameterSource("id", program.getId()),
            new SimpleMappers.ProgramMapper()
        ));
    }

    private static void insertMainGETTestData() {
        if (testProgram == null) {
            testProgram = insertTestData("ProgramControllerTestProgram", TestData.TEST_USER_ID);
            testProgramWorkout = testProgram.getWorkouts().get(0);
        }
    }

    private static Program findProgram(List<Program> programs, String id) {
        return programs.stream()
            .filter(p -> p.getId().equals(id))
            .findFirst().orElse(null);
    }
}
