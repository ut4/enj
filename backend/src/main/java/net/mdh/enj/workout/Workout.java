package net.mdh.enj.workout;

import net.mdh.enj.Utils;
import net.mdh.enj.mapping.DbEntity;
import javax.validation.constraints.Min;
import java.util.List;

/**
 * Treenientiteetti (/api/workout)
 */
public class Workout extends DbEntity {
    protected int id;
    @Min(value = 1)
    private long start;
    private long end;
    private String notes;
    private List<Exercise> exercises;

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

    @Override
    public String toString() {
        return "{" +
            "id=" + this.getId() +
            ", start=" + this.getStart() +
            ", end=" + this.getEnd() +
            ", notes=" + this.getNotes() +
            ", exercises=" + Utils.stringifyAll(this.getExercises()) +
        "}";
    }

    /**
     * Treeniliike-entiteetti
     */
    public static class Exercise extends DbEntity {
        protected int id;
        private int orderDef;
        private int workoutId;
        private int exerciseId;
        private String exerciseName;
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
            return this.exerciseId;
        }
        public void setExerciseId(int exerciseId) {
            this.exerciseId = exerciseId;
        }

        public String getExerciseName() {
            return this.exerciseName;
        }
        public void setExerciseName(String exerciseName) {
            this.exerciseName = exerciseName;
        }

        public List<Set> getSets() {
            return sets;
        }
        public void setSets(List<Set> sets) {
            this.sets = sets;
        }

        @Override
        public String toString() {
            return "{" +
                "id=" + this.getId() +
                ", orderDef=" + this.getOrderDef() +
                ", workoutId=" + this.getWorkoutId() +
                ", exerciseId=" + this.getExerciseId() +
                ", exerciseName=" + this.getExerciseName() +
                ", sets=" + Utils.stringifyAll(this.getSets()) +
            "}";
        }

        /**
         * Treeniliikesettientiteetti :D
         */
        public static class Set extends DbEntity {
            protected int id;
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
                return "{" +
                    "id=" + this.getId() +
                    ", weight=" + this.getWeight() +
                    ", reps=" + this.getReps() +
                "}";
            }
        }
    }
}
