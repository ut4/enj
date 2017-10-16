package net.mdh.enj.program;

import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.BeforeClass;
import java.util.Collections;

public class ProgramControllerTestCase extends RollbackingDBJerseyTest {

    static DbTestUtils utils;

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

    static Program makeNewProgramEntity(String name) {
        Program program = new Program();
        program.setName(name);
        program.setStart(123L);
        program.setEnd(456L);
        program.setDescription("...");
        return program;
    }

    static Program.Workout makeNewProgramWorkoutEntity(String name, String programId) {
        Program.Workout programWorkout = new Program.Workout();
        programWorkout.setName(name);
        // Joka maanantai, alkaa viikosta 0, ei toistu
        programWorkout.setOccurrences(
            Collections.singletonList(new Program.Workout.Occurrence(1, 0, null))
        );
        programWorkout.setOrdinal(1);
        programWorkout.setProgramId(programId);
        return programWorkout;
    }

    static Program.Workout.Exercise makeNewProgramWorkoutExerciseEntity(String programWorkoutId, String exerciseId) {
        Program.Workout.Exercise programWorkoutExercise = new Program.Workout.Exercise();
        programWorkoutExercise.setProgramWorkoutId(programWorkoutId);
        programWorkoutExercise.setExerciseId(exerciseId);
        programWorkoutExercise.setExerciseVariantId(null);
        programWorkoutExercise.setOrdinal(1);
        return programWorkoutExercise;
    }
}
