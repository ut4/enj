package net.mdh.enj.workout;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import java.util.function.Function;
import javax.inject.Inject;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WorkoutExerciseRepository extends BasicRepository<Workout.Exercise> {

    private final static String TABLE_NAME = "workoutExercise";

    @Inject
    WorkoutExerciseRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    @Override
    public int insert(Workout.Exercise workoutExercise) {
        return super.insert(workoutExercise, new BeanToParamMapTranformer());
    }

    @Override
    public int insert(List<Workout.Exercise> workoutExercises) {
        return super.insert(workoutExercises, new BeanToParamMapTranformer());
    }

    /**
     * Päivittää kaikki treeniliikkeet, ja palauttaa päivitettyjen rivien lukumäärän.
     *
     * @return {int} Päivitettyjen rivien lukumäärä
     */
    int updateMany(List<Workout.Exercise> workoutExercises) {
        return super.updateMany(
            "UPDATE workoutExercise SET " +
                "orderDef = :orderDef" +
                ", exerciseId = :exercise.id" +
                ", exerciseVariantId = :exerciseVariant.id" +
            " WHERE id = :id",
            workoutExercises
        );
    }

    private static class BeanToParamMapTranformer implements Function<Workout.Exercise, Map<String, ?>> {
        @Override
        public Map<String, ?> apply(Workout.Exercise workoutExercise) {
            Map<String, Object> data = new HashMap<>();
            data.put("id", workoutExercise.getId());
            data.put("orderDef", workoutExercise.getOrderDef());
            data.put("workoutId", workoutExercise.getWorkoutId());
            data.put("exerciseId", workoutExercise.getExercise().getId());
            data.put("exerciseVariantId", workoutExercise.getExerciseVariant().getId());
            return data;
        }
    }
}
