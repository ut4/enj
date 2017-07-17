package net.mdh.enj.workout;

import net.mdh.enj.Utils;
import net.mdh.enj.mapping.DbEntity;
import net.mdh.enj.validation.AuthenticatedUserId;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.Valid;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.Produces;
import java.util.List;

/**
 * Treenientiteetti (/api/workout)
 */
public class Workout extends DbEntity {
    @Min(value = 1)
    private long start;
    private long end;
    private String notes;
    private List<Exercise> exercises;
    @AuthenticatedUserId
    private int userId;

    public long getStart() {
        return this.start;
    }
    public void setStart(long start) {
        this.start = start;
    }

    public long getEnd() {
        return this.end;
    }
    public void setEnd(long end) {
        this.end = end;
    }

    public String getNotes() {
        return this.notes;
    }
    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<Exercise> getExercises() {
        return this.exercises;
    }
    public void setExercises(List<Exercise> exercises) {
        this.exercises = exercises;
    }

    public int getUserId() {
        return this.userId;
    }
    public void setUserId(int userId) {
        this.userId = userId;
    }

    @Override
    public String toString() {
        return "Workout{" +
            "id=" + this.getId() +
            ", start=" + this.getStart() +
            ", end=" + this.getEnd() +
            ", notes=" + this.getNotes() +
            ", userId=" + this.getUserId() +
            ", exercises=" + Utils.stringifyAll(this.getExercises()) +
        "}";
    }

    /**
     * Treeniliike-entiteetti
     */
    @Produces(MediaType.APPLICATION_JSON)
    public static class Exercise extends DbEntity {
        private int orderDef;
        @Min(value = 1)
        private int workoutId;
        @Valid
        @NotNull
        private net.mdh.enj.exercise.Exercise exercise;
        private List<Set> sets;

        public int getOrderDef() {
            return this.orderDef;
        }
        public void setOrderDef(int orderDef) {
            this.orderDef = orderDef;
        }

        public int getWorkoutId() {
            return this.workoutId;
        }
        public void setWorkoutId(int workoutId) {
            this.workoutId = workoutId;
        }

        public int getExerciseId() {
            return this.exercise != null ? this.exercise.getId() : 0;
        }
        public void setExerciseId(int exerciseId) {
            this.exercise.setId(exerciseId);
        }

        public net.mdh.enj.exercise.Exercise getExercise() {
            return exercise;
        }
        public void setExercise(net.mdh.enj.exercise.Exercise exercise) {
            this.exercise = exercise;
        }

        public List<Set> getSets() {
            return sets;
        }
        public void setSets(List<Set> sets) {
            this.sets = sets;
        }

        @Override
        public String toString() {
            return "Workout.Exercise{" +
                "id=" + this.getId() +
                ", orderDef=" + this.getOrderDef() +
                ", workoutId=" + this.getWorkoutId() +
                ", exercise=" + this.getExercise().toString() +
                ", sets=" + Utils.stringifyAll(this.getSets()) +
            "}";
        }

        /**
         * Treeniliikesettientiteetti :D
         */
        public static class Set extends DbEntity {
            private double weight;
            private int reps;
            private int workoutExerciseId;

            public double getWeight() {
                return weight;
            }
            public void setWeight(double weight) {
                this.weight = weight;
            }

            public int getReps() {
                return reps;
            }
            public void setReps(int reps) {
                this.reps = reps;
            }

            public int getWorkoutExerciseId() {
                return this.workoutExerciseId;
            }
            public void setWorkoutExerciseId(int workoutExerciseId) {
                this.workoutExerciseId = workoutExerciseId;
            }

            @Override
            public String toString() {
                return "Workout.Exercise.Set{" +
                    "id=" + this.getId() +
                    ", weight=" + this.getWeight() +
                    ", reps=" + this.getReps() +
                "}";
            }
        }
    }
}
