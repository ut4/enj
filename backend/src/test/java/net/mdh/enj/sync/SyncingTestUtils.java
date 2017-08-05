package net.mdh.enj.sync;

import net.mdh.enj.HttpClient;
import net.mdh.enj.resources.TestData;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.resources.TestController;
import net.mdh.enj.workout.WorkoutController;
import net.mdh.enj.workout.WorkoutRepository;
import net.mdh.enj.workout.WorkoutExerciseRepository;
import net.mdh.enj.workout.WorkoutExerciseSetRepository;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.server.ServerProperties;
import org.glassfish.jersey.server.ResourceConfig;

class SyncingTestUtils {
    static SyncRouteRegister getManuallyPopulateSyncRouteRegister() {
        // POST /api/workout
        SyncRoute workoutInsertRoute = new SyncRoute();
        workoutInsertRoute.setUrl(TestData.workoutInsertRoute.getUrl());
        workoutInsertRoute.setMethod(TestData.workoutInsertRoute.getMethod());
        // DELETE /api/workout/{workoutId}
        SyncRoute workoutDeleteRoute = new SyncRoute();
        workoutDeleteRoute.setUrl(TestData.workoutDeleteRoute.getUrl());
        workoutDeleteRoute.setMethod(TestData.workoutDeleteRoute.getMethod());
        workoutDeleteRoute.setPattern("workout/([^/]+)(/.*)?");
        // POST /api/workout/exercise
        SyncRoute workoutExerciseAddRoute = new SyncRoute();
        workoutExerciseAddRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl());
        workoutExerciseAddRoute.setMethod(TestData.workoutExerciseAddRoute.getMethod());
        //
        SyncRouteRegister register = new SyncRouteRegister();
        register.add(workoutInsertRoute);
        register.add(workoutDeleteRoute);
        register.add(workoutExerciseAddRoute);
        return register;
    }

    static ResourceConfig getResourceConfig(
        DataSourceFactory rollbackingDSFactory,
        SyncRouteRegister syncRouteRegister,
        HttpClient jerseyTestHttpClient
    ) {
        return new ResourceConfig()
            .register(SyncController.class)
            .register(TestController.class)
            // Kontrollerit, joiden dataa synkataan testeissä.
            .register(WorkoutController.class)
            // tänne lisää...
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(syncRouteRegister).to(SyncRouteRegister.class);
                    bind(jerseyTestHttpClient).to(HttpClient.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    // WorkoutController riippuvuudet
                    bind(WorkoutRepository.class).to(WorkoutRepository.class);
                    bind(WorkoutExerciseRepository.class).to(WorkoutExerciseRepository.class);
                    bind(WorkoutExerciseSetRepository.class).to(WorkoutExerciseSetRepository.class);
                }
            });
    }
}
