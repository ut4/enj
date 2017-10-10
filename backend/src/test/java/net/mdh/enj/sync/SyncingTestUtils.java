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
    static SyncRouteRegister getManuallyPopulatedSyncRouteRegister() {
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
        // POST /api/workout/exercise/all
        SyncRoute workoutExerciseAddAllRoute = new SyncRoute();
        workoutExerciseAddAllRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl() + "/all");
        workoutExerciseAddAllRoute.setMethod(TestData.workoutExerciseAddRoute.getMethod());
        // PUT /api/workout/exercise
        SyncRoute workoutExerciseUpdateRoute = new SyncRoute();
        workoutExerciseUpdateRoute.setUrl("workout/exercise");
        workoutExerciseUpdateRoute.setMethod("PUT");
        // DELETE /api/workout/exercise/{weId}
        SyncRoute workoutExerciseDeleteRoute = new SyncRoute();
        workoutExerciseDeleteRoute.setUrl("workout/exercise/{workoutExerciseId}");
        workoutExerciseDeleteRoute.setMethod("DELETE");
        workoutExerciseDeleteRoute.setPattern("workout/exercise/([^/]+)(/.*)?");
        // POST /api/exercise
        SyncRoute exerciseAddRoute = new SyncRoute();
        exerciseAddRoute.setUrl("exercise");
        exerciseAddRoute.setMethod("POST");
        // PUT /api/exercise/{exsId}
        SyncRoute exerciseUpdateRoute = new SyncRoute();
        exerciseUpdateRoute.setUrl("exercise/{exerciseId}");
        exerciseUpdateRoute.setMethod("PUT");
        exerciseUpdateRoute.setPattern("exercise/([^/]+)(/.*)?");
        // POST /api/exercise/variant
        SyncRoute exerciseVariantAddRoute = new SyncRoute();
        exerciseVariantAddRoute.setUrl("exercise/variant");
        exerciseVariantAddRoute.setMethod("POST");
        //
        SyncRouteRegister register = new SyncRouteRegister();
        register.add(workoutInsertRoute);
        register.add(workoutDeleteRoute);
        register.add(workoutExerciseAddRoute);
        register.add(workoutExerciseAddAllRoute);
        register.add(workoutExerciseUpdateRoute);
        register.add(workoutExerciseDeleteRoute);
        register.add(exerciseAddRoute);
        register.add(exerciseUpdateRoute);
        register.add(exerciseVariantAddRoute);
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
