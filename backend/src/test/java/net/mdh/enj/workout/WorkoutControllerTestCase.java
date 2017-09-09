package net.mdh.enj.workout;

import net.mdh.enj.exercise.Exercise;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.stat.StatController;
import net.mdh.enj.stat.StatRepository;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.DbTestUtils;
import net.mdh.enj.resources.RollbackingDBJerseyTest;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.BeforeClass;
import java.util.ArrayList;

public class WorkoutControllerTestCase extends RollbackingDBJerseyTest {

    protected static Workout testWorkout;
    protected static Exercise testExercise;
    protected static DbTestUtils utils;

    @BeforeClass
    public static void beforeClass() {
        utils = new DbTestUtils(rollbackingDSFactory);
        testWorkout = new Workout();
        testWorkout.setStart(System.currentTimeMillis() / 1000L);
        testWorkout.setUserId(TestData.TEST_USER_ID);
        testWorkout.setExercises(new ArrayList<>());
        utils.insertWorkout(testWorkout);
        testExercise = new Exercise();
        testExercise.setName("exs");
        utils.insertExercise(testExercise);
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig()
            .register(StatController.class)
            .register(WorkoutController.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(WorkoutRepository.class).to(WorkoutRepository.class);
                    bind(StatRepository.class).to(StatRepository.class);
                    bind(WorkoutExerciseRepository.class).to(WorkoutExerciseRepository.class);
                    bind(WorkoutExerciseSetRepository.class).to(WorkoutExerciseSetRepository.class);
                }
            });
    }
}
