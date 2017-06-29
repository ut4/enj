package net.mdh.enj;

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

class InjectionBinder extends AbstractBinder {
    @Override
    protected void configure() {
        // Common
        bind(SimpleDataSourceFactory.class).to(DataSourceFactory.class);
        bind(TokenService.class).to(TokenService.class);
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
