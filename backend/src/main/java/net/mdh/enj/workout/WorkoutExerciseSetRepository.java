package net.mdh.enj.workout;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import javax.inject.Inject;
import java.util.List;

public class WorkoutExerciseSetRepository extends BasicRepository<Workout.Exercise.Set> {

    public final static String TABLE_NAME = "workoutExerciseSet";

    @Inject
    WorkoutExerciseSetRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    int updateMany(List<Workout.Exercise.Set> workoutExerciseSets) {
        return super.updateMany(
            "UPDATE workoutExerciseSet SET weight = :weight, reps = :reps, ordinal = :ordinal WHERE id = :id",
            workoutExerciseSets
        );
    }
}
