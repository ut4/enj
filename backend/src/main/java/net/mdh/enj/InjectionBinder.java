package net.mdh.enj;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.db.SimpleDataSourceFactory;
import net.mdh.enj.workout.WorkoutRepository;
import org.glassfish.hk2.utilities.binding.AbstractBinder;

public class InjectionBinder extends AbstractBinder {
    @Override
    protected void configure() {
        // Common
        bind(SimpleDataSourceFactory.class).to(DataSourceFactory.class);
        // Workout
        bind(WorkoutRepository.class).to(WorkoutRepository.class);
        // Program
        // ...
        // Exercise
        // ???
    }
}
