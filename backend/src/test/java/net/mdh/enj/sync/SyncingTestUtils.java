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
        // PUT /api/workout
        SyncRoute workoutUpdateRoute = new SyncRoute();
        workoutUpdateRoute.setUrl("workout");
        workoutUpdateRoute.setMethod("PUT");
        // DELETE /api/workout/{workoutId}
        SyncRoute workoutDeleteRoute = new SyncRoute();
        workoutDeleteRoute.setUrl(TestData.workoutDeleteRoute.getUrl());
        workoutDeleteRoute.setMethod(TestData.workoutDeleteRoute.getMethod());
        workoutDeleteRoute.setPattern("workout/([^/]+)(/.*)?");
        // POST /api/workout/exercise
        SyncRoute workoutExerciseAddRoute = new SyncRoute();
        workoutExerciseAddRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl());
        workoutExerciseAddRoute.setMethod(TestData.workoutExerciseAddRoute.getMethod());
        workoutExerciseAddRoute.setParent("workout");
        workoutExerciseAddRoute.setForeignKey("workoutId");
        // POST /api/workout/exercise/all
        SyncRoute workoutExerciseAddAllRoute = new SyncRoute();
        workoutExerciseAddAllRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl() + "/all");
        workoutExerciseAddAllRoute.setMethod(TestData.workoutExerciseAddRoute.getMethod());
        workoutExerciseAddAllRoute.setParent("workout");
        workoutExerciseAddAllRoute.setForeignKey("workoutId");
        // PUT /api/workout/exercise
        SyncRoute workoutExerciseUpdateRoute = new SyncRoute();
        workoutExerciseUpdateRoute.setUrl("workout/exercise");
        workoutExerciseUpdateRoute.setMethod("PUT");
        workoutExerciseUpdateRoute.setParent("workout");
        workoutExerciseUpdateRoute.setForeignKey("workoutId");
        // DELETE /api/workout/exercise/{weId}
        SyncRoute workoutExerciseDeleteRoute = new SyncRoute();
        workoutExerciseDeleteRoute.setUrl("workout/exercise/{workoutExerciseId}");
        workoutExerciseDeleteRoute.setMethod("DELETE");
        workoutExerciseDeleteRoute.setPattern("workout/exercise/([^/]+)(/.*)?");
        workoutExerciseDeleteRoute.setParent("workout");
        workoutExerciseDeleteRoute.setForeignKey("workoutId");
        // POST /api/workout/exercise/set
        SyncRoute workoutExerciseSetAddRoute = new SyncRoute();
        workoutExerciseSetAddRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl() + "/set");
        workoutExerciseSetAddRoute.setMethod("POST");
        workoutExerciseSetAddRoute.setParent("workout/exercise");
        workoutExerciseSetAddRoute.setForeignKey("workoutExerciseId");
        // PUT /api/workout/exercise/set
        SyncRoute workoutExerciseSetUpdateRoute = new SyncRoute();
        workoutExerciseSetUpdateRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl() + "/set");
        workoutExerciseSetUpdateRoute.setMethod("PUT");
        workoutExerciseSetUpdateRoute.setParent("workout/exercise");
        workoutExerciseSetUpdateRoute.setForeignKey("workoutExerciseId");
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
        exerciseVariantAddRoute.setParent("exercise");
        exerciseVariantAddRoute.setForeignKey("exerciseId");
        // POST /api/program
        SyncRoute programAddRoute = new SyncRoute();
        programAddRoute.setUrl("program");
        programAddRoute.setMethod("POST");
        // DELETE /api/program/{programId}
        SyncRoute programDeleteRoute = new SyncRoute();
        programDeleteRoute.setUrl("program/{programId}");
        programDeleteRoute.setMethod("DELETE");
        programDeleteRoute.setPattern("program/([^/]+)(/.*)?");
        // POST /api/program/workout
        SyncRoute programWorkoutAddRoute = new SyncRoute();
        programWorkoutAddRoute.setUrl("program/workout");
        programWorkoutAddRoute.setMethod("POST");
        programWorkoutAddRoute.setParent("program");
        programWorkoutAddRoute.setForeignKey("programId");
        // PUT /api/program/workout/exercise
        SyncRoute programWorkoutExerciseEditRoute = new SyncRoute();
        programWorkoutExerciseEditRoute.setUrl("program/workout/exercise");
        programWorkoutExerciseEditRoute.setMethod("PUT");
        programWorkoutExerciseEditRoute.setParent("program/workout");
        programWorkoutExerciseEditRoute.setForeignKey("programWorkoutId");
        //
        SyncRouteRegister register = new SyncRouteRegister();
        register.add(workoutInsertRoute);
        register.add(workoutUpdateRoute);
        register.add(workoutDeleteRoute);
        register.add(workoutExerciseAddRoute);
        register.add(workoutExerciseAddAllRoute);
        register.add(workoutExerciseUpdateRoute);
        register.add(workoutExerciseDeleteRoute);
        register.add(workoutExerciseSetAddRoute);
        register.add(workoutExerciseSetUpdateRoute);
        register.add(exerciseAddRoute);
        register.add(exerciseUpdateRoute);
        register.add(exerciseVariantAddRoute);
        register.add(programAddRoute);
        register.add(programDeleteRoute);
        register.add(programWorkoutAddRoute);
        register.add(programWorkoutExerciseEditRoute);
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
