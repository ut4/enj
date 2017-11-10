package net.mdh.enj.program;

import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.BeforeClass;
import java.util.function.Consumer;
import java.util.Collections;

public class ProgramControllerTestCase extends RollbackingDBJerseyTest {

    static DbTestUtils utils;
    private static Exercise testExercise;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDSFactory);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(ProgramController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(ProgramRepository.class).to(ProgramRepository.class);
                    bind(ProgramWorkoutRepository.class).to(ProgramWorkoutRepository.class);
                    bind(ProgramWorkoutExerciseRepository.class).to(ProgramWorkoutExerciseRepository.class);
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                }
            });
    }

    public static Program makeNewProgramEntity(String name) {
        Program program = new Program();
        program.setName(name);
        program.setStart(123L);
        program.setEnd(456L);
        program.setDescription("...");
        return program;
    }

    public static Program.Workout makeNewProgramWorkoutEntity(String name, String programId) {
        Program.Workout programWorkout = new Program.Workout();
        programWorkout.setName(name);
        // Joka maanantai, alkaa viikosta 0, ei toistu
        programWorkout.setOccurrences(
            Collections.singletonList(new Program.Workout.Occurrence(1, 0, null))
        );
        programWorkout.setProgramId(programId);
        return programWorkout;
    }

    public static Program.Workout.Exercise makeNewProgramWorkoutExerciseEntity(String programWorkoutId, Exercise exercise) {
        Program.Workout.Exercise programWorkoutExercise = new Program.Workout.Exercise();
        programWorkoutExercise.setOrdinal(1);
        programWorkoutExercise.setProgramWorkoutId(programWorkoutId);
        programWorkoutExercise.setExerciseId(exercise.getId());
        programWorkoutExercise.setExerciseName(exercise.getName());
        programWorkoutExercise.setExerciseVariantId(null);
        return programWorkoutExercise;
    }

    static Program insertTestData(String name, String userId) {
        return insertTestData(name, userId, null);
    }
    static Program insertTestData(String name, String userId, Consumer<Program> programModder) {
        Program program = makeNewProgramEntity(name);
        if (programModder != null) {
            programModder.accept(program);
        }
        program.setUserId(userId);
        utils.insertProgram(program);
        Program.Workout pw = makeNewProgramWorkoutEntity(name + "Workout", program.getId());
        program.setWorkouts(Collections.singletonList(pw));
        utils.insertProgramWorkout(pw);
        if (testExercise == null) {
            testExercise = new Exercise();
            testExercise.setName("ProgramControllerTestExercise");
            utils.insertExercise(testExercise);
        }
        pw.setExercises(Collections.singletonList(makeNewProgramWorkoutExerciseEntity(pw.getId(), testExercise)));
        utils.insertProgramWorkoutExercise(pw.getExercises().get(0));
        return program;
    }
}
