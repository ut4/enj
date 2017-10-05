package net.mdh.enj.program;

import net.mdh.enj.api.Responses;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.SimpleMappers;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.Collections;
import org.junit.Assert;
import org.junit.Test;

public class ProgramControllerProgramWorkoutHandlersTest extends ProgramControllerTestCase {

    @Test
    public void PUTWorkoutPäivittääOhjelmatreeninTietokantaan() {
        // Luo testidata.
        Program program = this.makeNewProgramEntity("Testprogram");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        Program.Workout programWorkout = this.makeNewProgramWorkoutEntity("Testprogramworkout", program.getId());
        utils.insertProgramWorkout(programWorkout);
        // Muuta treeniliikkeen tietoja.
        programWorkout.setName("updatedName");
        programWorkout.setOccurrences(Collections.singletonList(new Program.Workout.Occurrence(3,3)));
        programWorkout.setOrdinal(2);
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
        Assert.assertEquals(programWorkout.getOrdinal(), actualProgramWorkout.getOrdinal());
        Assert.assertEquals("Ei pitäisi tallentaa muutettua programId:tä",
            program.getId(), actualProgramWorkout.getProgramId()
        );
    }

    @Test
    public void PUTWorkoutEiPäivitäToiselleKäyttäjälleKuuluvaaOhjelmatreeniä() {
        // Luo testidata.
        Program program = this.makeNewProgramEntity("NotMyProgram");
        program.setUserId(TestData.TEST_USER_ID2);
        utils.insertProgram(program);
        String originalProgramWorkoutName = "NotMyProgramworkout";
        Program.Workout programWorkout = this.makeNewProgramWorkoutEntity(originalProgramWorkoutName, program.getId());
        utils.insertProgramWorkout(programWorkout);
        // Muuta jotain.
        programWorkout.setName("updatedName");
        programWorkout.setOrdinal(3);
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
        Program program = this.makeNewProgramEntity("Another testprogram");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        Program.Workout programWorkout = this.makeNewProgramWorkoutEntity("Another testprogramworkout", program.getId());
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
        Program program = this.makeNewProgramEntity("Another notMyProgram");
        program.setUserId(TestData.TEST_USER_ID2);
        utils.insertProgram(program);
        String originalProgramWorkoutName = "Another notMyProgramworkout";
        Program.Workout programWorkout = this.makeNewProgramWorkoutEntity(originalProgramWorkoutName, program.getId());
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
