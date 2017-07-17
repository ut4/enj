package net.mdh.enj;

import net.mdh.enj.api.RequestContext;
import net.mdh.enj.sync.SyncRouteRegister;
import net.mdh.enj.user.UserRepository;
import net.mdh.enj.auth.TokenService;
import net.mdh.enj.auth.HashingProvider;
import net.mdh.enj.auth.Argon2HashingProvider;
import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.db.SimpleDataSourceFactory;
import net.mdh.enj.exercise.ExerciseRepository;
import net.mdh.enj.workout.WorkoutRepository;
import net.mdh.enj.workout.WorkoutExerciseRepository;
import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.glassfish.jersey.process.internal.RequestScoped;

class InjectionBinder extends AbstractBinder {
    @Override
    protected void configure() {
        // Common
        bind(RequestContext.class).to(RequestContext.class).in(RequestScoped.class);
        bind(SimpleDataSourceFactory.class).to(DataSourceFactory.class);
        bind(TokenService.class).to(TokenService.class);
        // Sync
        bind(new SyncRouteRegister()).to(SyncRouteRegister.class);
        bind(new AppResourceHttpClient()).to(HttpClient.class);
        // Workout
        bind(WorkoutRepository.class).to(WorkoutRepository.class);
        bind(WorkoutExerciseRepository.class).to(WorkoutExerciseRepository.class);
        // Exercise
        bind(ExerciseRepository.class).to(ExerciseRepository.class);
        // Program
        // ...
        // User
        bind(UserRepository.class).to(UserRepository.class);
        bind(Argon2HashingProvider.class).to(HashingProvider.class);
    }
}
