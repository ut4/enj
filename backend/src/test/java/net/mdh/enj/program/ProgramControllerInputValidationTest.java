package net.mdh.enj.program;

import net.mdh.enj.api.RequestContext;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.resources.JerseyTestCase;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.validation.ValidationError;
import org.mockito.Mockito;
import org.junit.Assert;
import org.junit.Test;
import javax.ws.rs.core.Response;
import java.util.Collections;
import java.util.List;

public class ProgramControllerInputValidationTest extends JerseyTestCase {

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(ProgramController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(Mockito.mock(ProgramRepository.class)).to(ProgramRepository.class);
                    bind(Mockito.mock(ProgramWorkoutRepository.class)).to(ProgramWorkoutRepository.class);
                    bind(Mockito.mock(ProgramWorkoutExerciseRepository.class)).to(ProgramWorkoutExerciseRepository.class);
                }
            });
    }

    @Test
    public void POSTInsertHylkääPyynnönJosDataPuuttuuKokonaan() {
        this.assertRequestFailsOnNullInput("program", "ProgramController.insert");
    }

    @Test
    public void POSTInsertValidoiInputDatan() {
        Program badData = this.makeNewInvalidProgram();
        Response response = this.newPostRequest("program", badData);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals("ProgramController.insert.arg0.end", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.name", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.start", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(2).getMessageTemplate());
        // workouts[0]
        Assert.assertEquals("ProgramController.insert.arg0.workouts[0].name", errors.get(3).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(3).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.workouts[0].occurrences[0].firstWeek", errors.get(4).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(4).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.workouts[0].occurrences[0].weekDay", errors.get(5).getPath());
        Assert.assertEquals("{javax.validation.constraints.Max.message}", errors.get(5).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.workouts[0].programId", errors.get(6).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(6).getMessageTemplate());
    }

    @Test
    public void POSTInsertEiHyväksyNullArvoja() {
        Program badData = new Program();
        badData.setName(null);
        badData.setStart(null);
        badData.setEnd(null);
        Response response = this.newPostRequest("program", badData);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals("ProgramController.insert.arg0.end", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.name", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.insert.arg0.start", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(2).getMessageTemplate());
    }

    @Test
    public void GETValidoiUrlin() {
        //
        Response response = this.newGetRequest("program/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("ProgramController.getMyProgram.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }

    @Test
    public void PUTValidoiInputin() {
        Program badData = this.makeNewInvalidProgram();
        String ignoreThis = TestData.TEST_USER_ID;
        Response response = this.newPutRequest("program/" + ignoreThis, badData);
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(7, errors.size());
        Assert.assertEquals("ProgramController.update.arg1.end", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.name", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.start", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(2).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.workouts[0].name", errors.get(3).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(3).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.workouts[0].occurrences[0].firstWeek", errors.get(4).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(4).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.workouts[0].occurrences[0].weekDay", errors.get(5).getPath());
        Assert.assertEquals("{javax.validation.constraints.Max.message}", errors.get(5).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.workouts[0].programId", errors.get(6).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(6).getMessageTemplate());
    }

    @Test
    public void PUTEiHyväksyNullArvoja() {
        Response response = this.newPutRequest("program/invaliduuid", "{}");
        Assert.assertEquals(400, response.getStatus());
        // Testaa että sisältää validaatiovirheet
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(5, errors.size());
        Assert.assertEquals("ProgramController.update.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.end", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.name", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(2).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.start", errors.get(3).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(3).getMessageTemplate());
        Assert.assertEquals("ProgramController.update.arg1.workouts", errors.get(4).getPath());
        Assert.assertEquals("{javax.validation.constraints.NotNull.message}", errors.get(4).getMessageTemplate());
    }

    @Test
    public void DELETEValidoiUrlin() {
        //
        Response response = this.newDeleteRequest("program/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("ProgramController.delete.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }


    @Test
    public void POSTWorkoutAllHylkääPyynnönJosDataPuuttuuKokonaan() {
        this.assertRequestFailsOnNullInput("program/workout/all", "ProgramController.insertAllProgramWorkouts");
    }

    @Test
    public void POSTWorkoutAllValidoiInputDatan() {
        Program badData = this.makeNewInvalidProgram();
        Response response = this.newPostRequest("program/workout/all", badData.getWorkouts());
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(4, errors.size());
        Assert.assertEquals("ProgramController.insertAllProgramWorkouts.arg0[0].name", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.insertAllProgramWorkouts.arg0[0].occurrences[0].firstWeek", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.insertAllProgramWorkouts.arg0[0].occurrences[0].weekDay", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.Max.message}", errors.get(2).getMessageTemplate());
        Assert.assertEquals("ProgramController.insertAllProgramWorkouts.arg0[0].programId", errors.get(3).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(3).getMessageTemplate());
    }

    @Test
    public void PUTWorkoutValidoiInputTaulukon() {
        // Luo virheellinen input
        Program.Workout badProgramWorkout = new Program.Workout();
        badProgramWorkout.setName("w");
        badProgramWorkout.setOccurrences(Collections.singletonList(new Program.Workout.Occurrence(-1,-1,0)));
        badProgramWorkout.setProgramId("not-valid-uuid");
        // Lähetä pyyntö
        Response response = this.newPutRequest("program/workout", Collections.singletonList(badProgramWorkout));
        Assert.assertEquals(400, response.getStatus());
        // Sisältääkö validaatiovirheet?
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(4, errors.size());
        Assert.assertEquals("ProgramController.updateAllProgramWorkouts.arg0[0].name", errors.get(0).getPath());
        Assert.assertEquals("{javax.validation.constraints.Size.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.updateAllProgramWorkouts.arg0[0].occurrences[0].firstWeek", errors.get(1).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.updateAllProgramWorkouts.arg0[0].occurrences[0].weekDay", errors.get(2).getPath());
        Assert.assertEquals("{javax.validation.constraints.Min.message}", errors.get(2).getMessageTemplate());
        Assert.assertEquals("ProgramController.updateAllProgramWorkouts.arg0[0].programId", errors.get(3).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(3).getMessageTemplate());
    }

    @Test
    public void DELETEWorkoutValidoiUrlin() {
        //
        Response response = this.newDeleteRequest("program/workout/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("ProgramController.deleteProgramWorkout.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }


    @Test
    public void POSTWorkoutExerciseAllHylkääPyynnönJosDataPuuttuuKokonaan() {
        this.assertRequestFailsOnNullInput("program/workout/exercise/all", "ProgramController.insertAllProgramWorkoutExercises");
    }

    @Test
    public void POSTWorkoutExerciseAllValidoiInputDatan() {
        Program.Workout.Exercise badData = this.makeNewInvalidProgramWorkoutExercise();
        Response response = this.newPostRequest("program/workout/exercise/all", Collections.singletonList(badData));
        Assert.assertEquals(400, response.getStatus());
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(3, errors.size());
        Assert.assertEquals("ProgramController.insertAllProgramWorkoutExercises.arg0[0].exerciseId", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.insertAllProgramWorkoutExercises.arg0[0].exerciseVariantId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.insertAllProgramWorkoutExercises.arg0[0].programWorkoutId", errors.get(2).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(2).getMessageTemplate());
    }

    @Test
    public void PUTWorkoutExerciseValidoiInputTaulukon() {
        // Luo virheellinen input
        Program.Workout.Exercise badData = this.makeNewInvalidProgramWorkoutExercise();
        // Lähetä pyyntö
        Response response = this.newPutRequest("program/workout/exercise", Collections.singletonList(badData));
        Assert.assertEquals(400, response.getStatus());
        // Sisältääkö validaatiovirheet?
        List<ValidationError> errors = this.getValidationErrors(response);
        Assert.assertEquals(3, errors.size());
        Assert.assertEquals("ProgramController.updateAllProgramWorkoutExercises.arg0[0].exerciseId", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
        Assert.assertEquals("ProgramController.updateAllProgramWorkoutExercises.arg0[0].exerciseVariantId", errors.get(1).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(1).getMessageTemplate());
        Assert.assertEquals("ProgramController.updateAllProgramWorkoutExercises.arg0[0].programWorkoutId", errors.get(2).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(2).getMessageTemplate());
    }

    @Test
    public void DELETEWorkoutExerciseValidoiUrlin() {
        //
        Response response = this.newDeleteRequest("program/workout/exercise/notvaliduuid");
        Assert.assertEquals(400, response.getStatus());
        //
        List<ValidationError> errors = super.getValidationErrors(response);
        Assert.assertEquals(1, errors.size());
        Assert.assertEquals("ProgramController.deleteProgramWorkoutExercise.arg0", errors.get(0).getPath());
        Assert.assertEquals("{net.mdh.enj.validation.UUID.message}", errors.get(0).getMessageTemplate());
    }

    private Program makeNewInvalidProgram() {
        Program badData = new Program();
        badData.setName("s");
        badData.setStart(-1L);
        badData.setEnd(-1L);
        Program.Workout badProgramWorkout = new Program.Workout();
        badProgramWorkout.setName("s");
        Program.Workout.Occurrence badOccurrence = new Program.Workout.Occurrence();
        badOccurrence.setWeekDay(9);
        badOccurrence.setFirstWeek(-1);
        badProgramWorkout.setOccurrences(Collections.singletonList(badOccurrence));
        badProgramWorkout.setProgramId("not-valid-uuid");
        badData.setWorkouts(Collections.singletonList(badProgramWorkout));
        return badData;
    }

    private Program.Workout.Exercise makeNewInvalidProgramWorkoutExercise() {
        Program.Workout.Exercise badProgramWorkoutExercise = new Program.Workout.Exercise();
        badProgramWorkoutExercise.setProgramWorkoutId("not-valid-uuid");
        badProgramWorkoutExercise.setExerciseId("not-valid-uuid");
        badProgramWorkoutExercise.setExerciseVariantId("not-valid-uuid");
        badProgramWorkoutExercise.setOrdinal(0);
        return badProgramWorkoutExercise;
    }
}
