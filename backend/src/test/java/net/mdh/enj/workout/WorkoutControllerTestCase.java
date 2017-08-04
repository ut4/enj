package net.mdh.enj.workout;

import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import net.mdh.enj.resources.TestData;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.ServerProperties;
import org.junit.BeforeClass;

public class WorkoutControllerTestCase extends RollbackingDBJerseyTest {

    static Workout testWorkout;
    static Exercise testExercise;
    static DbTestUtils utils;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDataSource);
        testWorkout = new Workout();
        testWorkout.setStart(System.currentTimeMillis() / 1000L);
        testWorkout.setUserId(TestData.TEST_USER_ID);
        utils.insertWorkout(testWorkout);
        testExercise = new Exercise();
        testExercise.setName("exs");
        utils.insertExercise(testExercise);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(WorkoutController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(WorkoutRepository.class).to(WorkoutRepository.class);
                    bind(WorkoutExerciseRepository.class).to(WorkoutExerciseRepository.class);
                    bind(WorkoutExerciseSetRepository.class).to(WorkoutExerciseSetRepository.class);
                }
            });
    }
}
