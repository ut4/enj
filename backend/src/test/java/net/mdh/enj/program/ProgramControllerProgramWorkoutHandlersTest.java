package net.mdh.enj.program;

import net.mdh.enj.api.Responses;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.SimpleMappers;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.Arrays;
import java.util.Collections;
import org.junit.Assert;
import java.util.List;
import org.junit.Test;

public class ProgramControllerProgramWorkoutHandlersTest extends ProgramControllerTestCase {

    @Test
    public void POSTWorkoutInsertoiKirjautuneenKäyttäjänOhjelmatreeninTietokantaan() {
        // Insertoi ohjelma, johon testattavat treenit lisätään
        Program program = makeNewProgramEntity("My cool prog");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        // Luo insertoitava ohjelmatreeni
        Program.Workout programWorkout = makeNewProgramWorkoutEntity("My cool prog workout", program.getId());
        // Lähetä pyyntö
        Response response = this.newPostRequest("program/workout", programWorkout);
        Assert.assertEquals(200, response.getStatus());
        Responses.InsertResponse responseBody = response.readEntity(new GenericType<Responses.InsertResponse>() {});
        Assert.assertEquals("InsertResponse.insertCount pitäisi olla 1", (Integer)1, responseBody.insertCount);
        // Insertoiko ohjelmatreenin?
        Program.Workout actualProgramWorkout = (Program.Workout) utils.selectOneWhere(
            "SELECT * FROM programWorkout WHERE id = :id",
            new MapSqlParameterSource("id", responseBody.insertId),
            new SimpleMappers.ProgramWorkoutMapper()
        );
        programWorkout.setId(responseBody.insertId);
        Assert.assertEquals(
            programWorkout.toString(),
            actualProgramWorkout.toString()
        );
    }

    @Test
    public void POSTWorkoutAllInsertoiKirjautuneenKäyttäjänOhjelmatreenitTietokantaan() {
        // Insertoi ohjelma, johon testattavat treenit lisätään
        Program program = makeNewProgramEntity("My cool prog2");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        // Luo insertoitavat ohjelmatreenit
        List<Program.Workout> programWorkouts = Collections.singletonList(
            makeNewProgramWorkoutEntity("My cool prog workout", program.getId())
        );
        // Lähetä pyyntö
        Response response = this.newPostRequest("program/workout/all", programWorkouts);
        Assert.assertEquals(200, response.getStatus());
        Responses.MultiInsertResponse responseBody = response.readEntity(new GenericType<Responses.MultiInsertResponse>() {});
        Assert.assertEquals("MultiInsertResponse.insertCount pitäisi olla 1", (Integer)1, responseBody.insertCount);
        // Insertoiko ohjelmatreenin?
        List actualProgramWorkouts = utils.selectAllWhere(
            "SELECT * FROM programWorkout WHERE id = :id",
            new MapSqlParameterSource("id", responseBody.insertIds.get(0)),
            new SimpleMappers.ProgramWorkoutMapper()
        );
        Assert.assertEquals(1, actualProgramWorkouts.size());
        programWorkouts.get(0).setId(responseBody.insertIds.get(0));
        Assert.assertEquals(
            programWorkouts.get(0).toString(),
            actualProgramWorkouts.get(0).toString()
        );
    }

    @Test
    public void POSTWorkoutAllEiInsertoiTreenejäToisenKäyttäjänOhjelmaan() {
        // Insertoi pari ohjelmaa, joista toinen kuuluu toiselle käyttäjälle
        Program program = makeNewProgramEntity("My program");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        Program notMyProgram = makeNewProgramEntity("Not My program");
        notMyProgram.setUserId(TestData.TEST_USER_ID2);
        utils.insertProgram(notMyProgram);
        // Luo insertoitavat ohjelmatreenit, joista jälkimmäinen kuuluu toiselle käyttäjälle
        List<Program.Workout> programWorkouts = Arrays.asList(
            makeNewProgramWorkoutEntity("My cool prog workout", program.getId()),
            makeNewProgramWorkoutEntity("Some other users cool prog workout", notMyProgram.getId())
        );
        //
        Response response = this.newPostRequest("program/workout/all", programWorkouts);
        Assert.assertEquals(400, response.getStatus());
        // Jättikö insertoimatta?
        Assert.assertEquals(0, utils.selectAllWhere(
            "SELECT * FROM programWorkout WHERE programId IN(:programId1, :programId2)",
            new MapSqlParameterSource("programId1", program.getId()).addValue("programId2", notMyProgram.getId()),
            new SimpleMappers.ProgramWorkoutMapper()
        ).size());
    }

    @Test
    public void PUTWorkoutPäivittääOhjelmatreeninTietokantaan() {
        // Luo testidata.
        Program program = makeNewProgramEntity("Testprogram");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        Program.Workout programWorkout = makeNewProgramWorkoutEntity("Testprogramworkout", program.getId());
        utils.insertProgramWorkout(programWorkout);
        // Muuta treeniliikkeen tietoja.
        programWorkout.setName("updatedName");
        programWorkout.setOccurrences(Collections.singletonList(new Program.Workout.Occurrence(3,0,3)));
        programWorkout.setProgramId(TestData.TEST_USER_ID); // Ei pitäisi vaikuttaa
        // PUTtaa muutetut tiedot
        Response response = this.newPutRequest("program/workout", Collections.singletonList(programWorkout));
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 1", (Integer)1, responseBody.updateCount);
        // Päivittikö tiedot kantaan?
        Program.Workout actualProgramWorkout = (Program.Workout) utils.selectOneWhere(
            "SELECT * FROM programWorkout WHERE id = :id",
            new MapSqlParameterSource("id", programWorkout.getId()),
            new SimpleMappers.ProgramWorkoutMapper()
        );
        Assert.assertEquals(programWorkout.getName(), actualProgramWorkout.getName());
        Assert.assertEquals(programWorkout.getOccurrencesAsString(), actualProgramWorkout.getOccurrencesAsString());
        Assert.assertEquals("Ei pitäisi tallentaa muutettua programId:tä",
            program.getId(), actualProgramWorkout.getProgramId()
        );
    }

    @Test
    public void PUTWorkoutEiPäivitäToiselleKäyttäjälleKuuluvaaOhjelmatreeniä() {
        // Luo testidata.
        Program program = makeNewProgramEntity("NotMyProgram");
        program.setUserId(TestData.TEST_USER_ID2);
        utils.insertProgram(program);
        String originalProgramWorkoutName = "NotMyProgramworkout";
        Program.Workout programWorkout = makeNewProgramWorkoutEntity(originalProgramWorkoutName, program.getId());
        utils.insertProgramWorkout(programWorkout);
        // Muuta jotain.
        programWorkout.setName("updatedName");
        // PUTtaa muutetut tiedot
        Response response = this.newPutRequest("program/workout", Collections.singletonList(programWorkout));
        Assert.assertEquals(400, response.getStatus());
        // Jättikö tiedot päivittämättä?
        Program.Workout actualProgramWorkout = (Program.Workout) utils.selectOneWhere(
            "SELECT * FROM programWorkout WHERE id = :id",
            new MapSqlParameterSource("id", programWorkout.getId()),
            new SimpleMappers.ProgramWorkoutMapper()
        );
        Assert.assertEquals(originalProgramWorkoutName, actualProgramWorkout.getName());
    }

    @Test
    public void DELETEWorkoutPoistaaOhjelmatreeninTietokannasta() {
        // Luo testidata.
        Program program = makeNewProgramEntity("Another testprogram");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        Program.Workout programWorkout = makeNewProgramWorkoutEntity("Another testprogramworkout", program.getId());
        utils.insertProgramWorkout(programWorkout);
        // Lähetä DELETE-pyyntö
        Response response = this.newDeleteRequest("program/workout/" + programWorkout.getId());
        Assert.assertEquals(200, response.getStatus());
        Responses.DeleteResponse responseBody = response.readEntity(new GenericType<Responses.DeleteResponse>() {});
        Assert.assertEquals("DeleteResponse.deleteCount pitäisi olla 1", (Integer)1, responseBody.deleteCount);
        // Poistiko ohjelmatreenin kannasta?
        Assert.assertNull(utils.selectOneWhere(
            "SELECT * FROM programWorkout WHERE id = :id",
            new MapSqlParameterSource("id", programWorkout.getId()),
            new SimpleMappers.ProgramWorkoutMapper()
        ));
    }

    @Test
    public void DELETEWorkoutEiPoistaToiselleKäyttäjälleKuuluvaaOhjelmatreeniä() {
        // Luo testidata.
        Program program = makeNewProgramEntity("Another notMyProgram");
        program.setUserId(TestData.TEST_USER_ID2);
        utils.insertProgram(program);
        Program.Workout programWorkout = makeNewProgramWorkoutEntity("Another notMyProgramworkout", program.getId());
        utils.insertProgramWorkout(programWorkout);
        // Lähetä DELETE-pyyntö
        Response response = this.newDeleteRequest("program/workout/" + programWorkout.getId());
        Assert.assertEquals(400, response.getStatus());
        // Jättikö tiedot rauhaan?
        Assert.assertNotNull(utils.selectOneWhere(
            "SELECT * FROM programWorkout WHERE id = :id",
            new MapSqlParameterSource("id", programWorkout.getId()),
            new SimpleMappers.ProgramWorkoutMapper()
        ));
    }
}
