package net.mdh.enj.program;

import net.mdh.enj.api.Responses;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.SimpleMappers;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import javax.ws.rs.core.GenericType;
import javax.ws.rs.core.Response;
import java.util.Collections;
import java.util.Arrays;
import java.util.List;
import org.junit.BeforeClass;
import org.junit.Assert;
import org.junit.Test;

public class ProgramControllerProgramWorkoutExerciseHandlersTest extends ProgramControllerTestCase {

    private static Exercise testExercise;

    @BeforeClass
    public static void beforeClass() {
        ProgramControllerTestCase.beforeClass();
        testExercise = new Exercise();
        testExercise.setName("ProgramWorkoutExerciseTestExercise");
        utils.insertExercise(testExercise);
    }

    @Test
    public void POSTWorkoutExerciseAllInsertoiKirjautuneenKäyttäjänOhjelmatreeniliikkeetTietokantaan() {
        Program program = makeNewProgramEntity("ProgramWorkoutExercisePOSTTestProgram");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        Program.Workout programWorkout = makeNewProgramWorkoutEntity("ProgramWorkoutExercisePOSTTestProgramWorkout", program.getId());
        utils.insertProgramWorkout(programWorkout);
        // Luo insertoitavat ohjelmatreeniliikkeet
        List<Program.Workout.Exercise> programWorkoutExercises = Collections.singletonList(
            makeNewProgramWorkoutExerciseEntity(programWorkout.getId(), testExercise)
        );
        // Lähetä pyyntö
        Response response = this.newPostRequest("program/workout/exercise/all", programWorkoutExercises);
        Assert.assertEquals(200, response.getStatus());
        Responses.MultiInsertResponse responseBody = response.readEntity(new GenericType<Responses.MultiInsertResponse>() {});
        Assert.assertEquals("MultiInsertResponse.insertCount pitäisi olla 1", (Integer)1, responseBody.insertCount);
        // Insertoiko ohjelmatreeniliikkeen?
        List actualProgramWorkoutExercises = utils.selectAllWhere(
            "SELECT * FROM programWorkoutExercise WHERE id = :id",
            new MapSqlParameterSource("id", responseBody.insertIds.get(0)),
            new SimpleMappers.ProgramWorkoutExerciseMapper()
        );
        Assert.assertEquals(1, actualProgramWorkoutExercises.size());
        programWorkoutExercises.get(0).setId(responseBody.insertIds.get(0));
        programWorkoutExercises.get(0).setExerciseName(null);
        Assert.assertEquals(
            programWorkoutExercises.get(0).toString(),
            actualProgramWorkoutExercises.get(0).toString()
        );
    }

    @Test
    public void POSTWorkoutAllEiInsertoiTreenejäToisenKäyttäjänOhjelmaan() {
        // Insertoi pari ohjelmaa, joista toinen kuuluu toiselle käyttäjälle
        Program program = makeNewProgramEntity("MyProgramWorkoutExercisePOSTTestProgram");
        program.setUserId(TestData.TEST_USER_ID);
        utils.insertProgram(program);
        Program notMyProgram = makeNewProgramEntity("NotMyProgramWorkoutExercisePOSTTestProgram");
        notMyProgram.setUserId(TestData.TEST_USER_ID2);
        utils.insertProgram(notMyProgram);
        // Insertoi ohjelmatreenit, johon liikkeet lisätään
        Program.Workout programWorkout1 = makeNewProgramWorkoutEntity("MyProgramWorkoutExercisePOSTTestProgramWorkout", program.getId());
        Program.Workout programWorkout2 = makeNewProgramWorkoutEntity("NoMyProgramWorkoutExercisePOSTTestProgramWorkout", notMyProgram.getId());
        utils.insertProgramWorkout(programWorkout1);
        utils.insertProgramWorkout(programWorkout2);
        // Insertoi liikkeet treeneihin, joista jälkimmäinen kuuluu toiselle käyttäjälle
        List<Program.Workout.Exercise> programWorkoutExercises = Arrays.asList(
            makeNewProgramWorkoutExerciseEntity(programWorkout1.getId(), testExercise),
            makeNewProgramWorkoutExerciseEntity(programWorkout2.getId(), testExercise)
        );
        //
        Response response = this.newPostRequest("program/workout/exercise/all", programWorkoutExercises);
        Assert.assertEquals(400, response.getStatus());
        // Jättikö insertoimatta?
        Assert.assertEquals(0, utils.selectAllWhere(
            "SELECT * FROM programWorkoutExercise WHERE programWorkoutId IN(:pwId1, :pwId2)",
            new MapSqlParameterSource("pwId1", programWorkout1.getId()).addValue("pwId2", programWorkout2.getId()),
            new SimpleMappers.ProgramWorkoutExerciseMapper()
        ).size());
    }

    @Test
    public void PUTWorkoutExercisePäivittääOhjelmatreeniliikkeenTietokantaan() {
        // Luo testidata.
        Program program = insertTestData("WorkoutExercisePUTTestProgram", TestData.TEST_USER_ID);
        Program.Workout.Exercise programWorkoutExercise = program.getWorkouts().get(0).getExercises().get(0);
        // Muuta ohjelmatreeniliikkeen tietoja.
        programWorkoutExercise.setOrdinal(3);
        // PUTtaa muutetut tiedot
        Response response = this.newPutRequest("program/workout/exercise", Collections.singletonList(programWorkoutExercise));
        Assert.assertEquals(200, response.getStatus());
        Responses.UpdateResponse responseBody = response.readEntity(new GenericType<Responses.UpdateResponse>() {});
        Assert.assertEquals("UpdateResponse.updateCount pitäisi olla 1", (Integer)1, responseBody.updateCount);
        // Päivittikö tiedot kantaan?
        Program.Workout.Exercise actualProgramWorkoutExercise = (Program.Workout.Exercise) utils.selectOneWhere(
            "SELECT * FROM programWorkoutExercise WHERE id = :id",
            new MapSqlParameterSource("id", programWorkoutExercise.getId()),
            new SimpleMappers.ProgramWorkoutExerciseMapper()
        );
        Assert.assertEquals(programWorkoutExercise.getOrdinal(), actualProgramWorkoutExercise.getOrdinal());
    }

    @Test
    public void PUTWorkoutExerciseEiPäivitäToiselleKäyttäjälleKuuluvaaOhjelmatreeniliikettä() {
        // Luo testidata.
        Program program = insertTestData("WorkoutExercisePUTTestNotMyProgram", TestData.TEST_USER_ID2);
        Program.Workout.Exercise programWorkoutExercise = program.getWorkouts().get(0).getExercises().get(0);
        // Muuta jotain.
        int originalOrdinal = programWorkoutExercise.getOrdinal();
        programWorkoutExercise.setOrdinal(8);
        // PUTtaa muutetut tiedot
        Response response = this.newPutRequest("program/workout/exercise", Collections.singletonList(programWorkoutExercise));
        Assert.assertEquals(400, response.getStatus());
        // Jättikö tiedot päivittämättä?
        Program.Workout.Exercise actualProgramWorkoutExercise = (Program.Workout.Exercise) utils.selectOneWhere(
            "SELECT * FROM programWorkoutExercise WHERE id = :id",
            new MapSqlParameterSource("id", programWorkoutExercise.getId()),
            new SimpleMappers.ProgramWorkoutExerciseMapper()
        );
        Assert.assertEquals(originalOrdinal, actualProgramWorkoutExercise.getOrdinal());
    }
}
