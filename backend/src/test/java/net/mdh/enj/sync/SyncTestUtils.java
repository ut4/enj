package net.mdh.enj.sync;

import net.mdh.enj.HttpClient;
import net.mdh.enj.api.RequestContext;
import net.mdh.enj.resources.TestData;
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

    static ResourceConfig configure(DataSourceFactory rollbackingDSFactory, HttpClient testClassInstance) {
        return new ResourceConfig()
            .register(SyncController.class)
            .register(TestController.class)
            .register(SyncRouteCollector.class)
            // Kontrollerit, joiden dataa synkataan testeissä.
            .register(WorkoutController.class)
            // tänne lisää...
            .property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
            .register(new AbstractBinder() {
                @Override
                protected void configure() {
                    bind(rollbackingDSFactory).to(DataSourceFactory.class);
                    bind(syncRouteRegister).to(SyncRouteRegister.class);
                    bind(testClassInstance).to(HttpClient.class);
                    bind(TestData.testUserAwareRequestContext).to(RequestContext.class);
                    // WorkoutController riippuvuudet
                    bind(WorkoutRepository.class).to(WorkoutRepository.class);
                    bind(WorkoutExerciseRepository.class).to(WorkoutExerciseRepository.class);
                    bind(WorkoutExerciseSetRepository.class).to(WorkoutExerciseSetRepository.class);
                }
            });
    }

    static SyncQueueItem newSyncQueueItem(int id, String url, String method, Object data) {
        SyncQueueItem item = new SyncQueueItem();
        item.setId(id);
        item.setRoute(new Route(url, method));
        item.setData(data);
        return item;
    }
}
