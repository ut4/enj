package net.mdh.enj.workout;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import javax.inject.Inject;

public class WorkoutExerciseRepository extends BasicRepository<Workout.Exercise> {

    public final static String TABLE_NAME = "workoutExercise";

    @Inject
    WorkoutExerciseRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }
}
