package net.mdh.enj.workout;

import net.mdh.enj.db.DataSourceFactory;
import net.mdh.enj.mapping.BasicRepository;
import javax.inject.Inject;
import java.util.List;

public class WorkoutExerciseRepository extends BasicRepository<Workout.Exercise> {

    private final static String TABLE_NAME = "workoutExercise";

    @Inject
    WorkoutExerciseRepository(DataSourceFactory dSFactory) {
        super(dSFactory, TABLE_NAME);
    }

    @Override
    public int insert(Workout.Exercise workoutExercise) {
        return super.insert(workoutExercise);
    }

    @Override
    public int insert(List<Workout.Exercise> workoutExercises) {
        return super.insert(workoutExercises);
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
                ", exerciseId = :exerciseId" +
                ", exerciseVariantId = :exerciseVariantId" +
            " WHERE id = :id",
            workoutExercises
        );
    }
}
