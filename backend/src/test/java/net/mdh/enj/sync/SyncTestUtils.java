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

class SyncTestUtils {
    private static SyncRouteRegister syncRouteRegister = new SyncRouteRegister();
    static SyncRouteRegister getManuallyPopulatedSyncRouteRegister() {
        // POST /api/workout
        SyncRoute workoutInsertRoute = new SyncRoute();
        workoutInsertRoute.setUrl(TestData.workoutInsertRoute.getUrl());
        workoutInsertRoute.setMethod(TestData.workoutInsertRoute.getMethod());
        workoutInsertRoute.setDependent("workout/exercise", "workoutId");
        // POST /api/workout/all
        SyncRoute workoutInsertAllRoute = new SyncRoute();
        workoutInsertAllRoute.setUrl(TestData.workoutInsertRoute.getUrl() + "/all");
        workoutInsertAllRoute.setMethod(TestData.workoutInsertRoute.getMethod());
        workoutInsertAllRoute.setDependent("workout/exercise", "workoutId");
        // PUT /api/workout
        SyncRoute workoutUpdateRoute = new SyncRoute();
        workoutUpdateRoute.setUrl("workout");
        workoutUpdateRoute.setMethod("PUT");
        workoutUpdateRoute.setDependent("workout/exercise", "workoutId");
        // DELETE /api/workout/{workoutId}
        SyncRoute workoutDeleteRoute = new SyncRoute();
        workoutDeleteRoute.setUrl(TestData.workoutDeleteRoute.getUrl());
        workoutDeleteRoute.setMethod(TestData.workoutDeleteRoute.getMethod());
        workoutDeleteRoute.setPattern("workout/([^/]+)(/.*)?");
        workoutDeleteRoute.setDependent("workout/exercise", "workoutId");
        // POST /api/workout/exercise
        SyncRoute workoutExerciseAddRoute = new SyncRoute();
        workoutExerciseAddRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl());
        workoutExerciseAddRoute.setMethod(TestData.workoutExerciseAddRoute.getMethod());
        workoutExerciseAddRoute.setDependent("workout/exercise/set", "workoutExerciseId");
        // POST /api/workout/exercise/all
        SyncRoute workoutExerciseAddAllRoute = new SyncRoute();
        workoutExerciseAddAllRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl() + "/all");
        workoutExerciseAddAllRoute.setMethod(TestData.workoutExerciseAddRoute.getMethod());
        workoutExerciseAddAllRoute.setDependent("workout/exercise/set", "workoutExerciseId");
        // PUT /api/workout/exercise
        SyncRoute workoutExerciseUpdateRoute = new SyncRoute();
        workoutExerciseUpdateRoute.setUrl("workout/exercise");
        workoutExerciseUpdateRoute.setMethod("PUT");
        workoutExerciseUpdateRoute.setDependent("workout/exercise/set", "workoutExerciseId");
        // DELETE /api/workout/exercise/{weId}
        SyncRoute workoutExerciseDeleteRoute = new SyncRoute();
        workoutExerciseDeleteRoute.setUrl("workout/exercise/{workoutExerciseId}");
        workoutExerciseDeleteRoute.setMethod("DELETE");
        workoutExerciseDeleteRoute.setPattern("workout/exercise/([^/]+)(/.*)?");
        workoutExerciseDeleteRoute.setDependent("workout/exercise/set", "workoutExerciseId");
        // POST /api/workout/exercise/set
        SyncRoute workoutExerciseSetAddRoute = new SyncRoute();
        workoutExerciseSetAddRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl() + "/set");
        workoutExerciseSetAddRoute.setMethod("POST");
        // POST /api/workout/exercise/set
        SyncRoute workoutExerciseSetAddAllRoute = new SyncRoute();
        workoutExerciseSetAddAllRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl() + "/set/all");
        workoutExerciseSetAddAllRoute.setMethod("POST");
        // PUT /api/workout/exercise/set
        SyncRoute workoutExerciseSetUpdateRoute = new SyncRoute();
        workoutExerciseSetUpdateRoute.setUrl(TestData.workoutExerciseAddRoute.getUrl() + "/set");
        workoutExerciseSetUpdateRoute.setMethod("PUT");
        // DELETE /api/workout/exercise/set/{wesId}
        SyncRoute workoutExerciseSetDeleteRoute = new SyncRoute();
        workoutExerciseSetDeleteRoute.setUrl("workout/exercise/set/{workoutExerciseSetId}");
        workoutExerciseSetDeleteRoute.setMethod("DELETE");
        workoutExerciseSetDeleteRoute.setPattern("workout/exercise/set/([^/]+)(/.*)?");
        // POST /api/exercise
        SyncRoute exerciseAddRoute = new SyncRoute();
        exerciseAddRoute.setUrl("exercise");
        exerciseAddRoute.setMethod("POST");
        exerciseAddRoute.setDependent("exercise/variant", "exerciseId");
        // PUT /api/exercise/{exsId}
        SyncRoute exerciseUpdateRoute = new SyncRoute();
        exerciseUpdateRoute.setUrl("exercise/{exerciseId}");
        exerciseUpdateRoute.setMethod("PUT");
        exerciseUpdateRoute.setPattern("exercise/([^/]+)(/.*)?");
        exerciseUpdateRoute.setDependent("exercise/variant", "exerciseId");
        // POST /api/exercise/variant
        SyncRoute exerciseVariantAddRoute = new SyncRoute();
        exerciseVariantAddRoute.setUrl("exercise/variant");
        exerciseVariantAddRoute.setMethod("POST");
        // POST /api/program
        SyncRoute programAddRoute = new SyncRoute();
        programAddRoute.setUrl("program");
        programAddRoute.setMethod("POST");
        programAddRoute.setDependent("program/workout", "programId");
        // DELETE /api/program/{programId}
        SyncRoute programDeleteRoute = new SyncRoute();
        programDeleteRoute.setUrl("program/{programId}");
        programDeleteRoute.setMethod("DELETE");
        programDeleteRoute.setPattern("program/([^/]+)(/.*)?");
        programDeleteRoute.setDependent("program/workout", "programId");
        // POST /api/program/workout
        SyncRoute programWorkoutAddRoute = new SyncRoute();
        programWorkoutAddRoute.setUrl("program/workout");
        programWorkoutAddRoute.setMethod("POST");
        programWorkoutAddRoute.setDependent("program/workout/exercise", "programWorkoutId");
        // PUT /api/program/workout/exercise
        SyncRoute programWorkoutExerciseEditRoute = new SyncRoute();
        programWorkoutExerciseEditRoute.setUrl("program/workout/exercise");
        programWorkoutExerciseEditRoute.setMethod("PUT");
        programWorkoutExerciseEditRoute.setDependent("program/workout/exercise", "programWorkoutId");
        //
        SyncRouteRegister register = new SyncRouteRegister();
        register.add(workoutInsertRoute);
        register.add(workoutInsertAllRoute);
        register.add(workoutUpdateRoute);
        register.add(workoutDeleteRoute);
        register.add(workoutExerciseAddRoute);
        register.add(workoutExerciseAddAllRoute);
        register.add(workoutExerciseUpdateRoute);
        register.add(workoutExerciseDeleteRoute);
        register.add(workoutExerciseSetAddRoute);
        register.add(workoutExerciseSetAddAllRoute);
        register.add(workoutExerciseSetUpdateRoute);
        register.add(workoutExerciseSetDeleteRoute);
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
            .register(WorkoutController.class)
            .register(SyncRouteCollector.class)
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(syncRouteRegister).to(SyncRouteRegister.class);
                    bind(jerseyTestHttpClient).to(HttpClient.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    bind(WorkoutRepository.class).to(WorkoutRepository.class);
                    bind(WorkoutExerciseRepository.class).to(WorkoutExerciseRepository.class);
                    bind(WorkoutExerciseSetRepository.class).to(WorkoutExerciseSetRepository.class);
                }
            });
    }

    static ResourceConfig getResourceConfig(
        DataSourceFactory rollbackingDSFactory,
        HttpClient jerseyTestHttpClient
    ) {
        return getResourceConfig(rollbackingDSFactory, syncRouteRegister, jerseyTestHttpClient);
    }

    static SyncQueueItem newSyncQueueItem(int id, String url, String method, Object data) {
        SyncQueueItem item = new SyncQueueItem();
        item.setId(id);
        item.setRoute(new Route(url, method));
        item.setData(data);
        return item;
    }
}
