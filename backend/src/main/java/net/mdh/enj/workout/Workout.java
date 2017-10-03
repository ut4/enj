package net.mdh.enj.workout;

import net.mdh.enj.mapping.DbEntity;
import net.mdh.enj.validation.UUID;
import net.mdh.enj.validation.AuthenticatedUserId;
import javax.validation.constraints.Min;
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
    private String userId;

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

    public String getUserId() {
        return this.userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    @Override
    public String toUpdateFields() {
        return "`start` = :start, `end` = :end, `notes` = :notes";
    }

    @Override
    public String toString() {
        return "Workout{" +
            "id=" + this.getId() +
            ", start=" + this.getStart() +
            ", end=" + this.getEnd() +
            ", notes=" + this.getNotes() +
            ", userId=" + this.getUserId() +
            ", exercises=" + this.getExercises() +
        "}";
    }

    /**
     * Treeniliike-entiteetti
     */
    public static class Exercise extends DbEntity {
        private int ordinal;
        @UUID
        private String workoutId;
        @UUID
        private String exerciseId;
        private String exerciseName;
        private List<Set> sets;
        @UUID(allowNull = true)
        private String exerciseVariantId;
        private String exerciseVariantContent;

        public int getOrdinal() {
            return this.ordinal;
        }
        public void setOrdinal(int ordinal) {
            this.ordinal = ordinal;
        }

        public String getWorkoutId() {
            return this.workoutId;
        }
        public void setWorkoutId(String workoutId) {
            this.workoutId = workoutId;
        }

        public String getExerciseId() {
            return this.exerciseId;
        }
        public void setExerciseId(String exerciseId) {
            this.exerciseId = exerciseId;
        }

        public String getExerciseName() {
            return this.exerciseName;
        }
        public void setExerciseName(String exerciseName) {
            this.exerciseName = exerciseName;
        }

        public String getExerciseVariantId() {
            return this.exerciseVariantId;
        }
        public void setExerciseVariantId(String exerciseVariantId) {
            this.exerciseVariantId = exerciseVariantId;
        }

        public String getExerciseVariantContent() {
            return this.exerciseVariantContent;
        }
        public void setExerciseVariantContent(String exerciseVariantContent) {
            this.exerciseVariantContent = exerciseVariantContent;
        }

        public List<Set> getSets() {
            return sets;
        }
        public void setSets(List<Set> sets) {
            this.sets = sets;
        }

        @Override
        public String toUpdateFields() {
            return "ordinal = :ordinal" +
                ", exerciseId = :exerciseId" +
                ", exerciseVariantId = :exerciseVariantId";
        }

        @Override
        public String toString() {
            return "Workout.Exercise{" +
                "id=" + this.getId() +
                ", ordinal=" + this.getOrdinal() +
                ", workoutId=" + this.getWorkoutId() +
                ", exerciseId=" + this.getExerciseId() +
                ", exerciseName=" + this.getExerciseName() +
                ", exerciseVariantId=" + this.getExerciseVariantId() +
                ", exerciseVariantContent=" + this.getExerciseVariantContent() +
                ", sets=" + this.getSets() +
            "}";
        }

        /**
         * Treeniliikesettientiteetti :D
         */
        public static class Set extends DbEntity {
            private double weight;
            @Min(value = 1)
            private int reps;
            private int ordinal;
            @UUID
            private String workoutExerciseId;

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

            public int getOrdinal() {
                return this.ordinal;
            }
            public void setOrdinal(int ordinal) {
                this.ordinal = ordinal;
            }

            public String getWorkoutExerciseId() {
                return this.workoutExerciseId;
            }
            public void setWorkoutExerciseId(String workoutExerciseId) {
                this.workoutExerciseId = workoutExerciseId;
            }

            @Override
            public String toUpdateFields() {
                return "weight = :weight, reps = :reps, ordinal = :ordinal";
            }

            @Override
            public String toString() {
                return "Workout.Exercise.Set{" +
                    "id=" + this.getId() +
                    ", weight=" + this.getWeight() +
                    ", reps=" + this.getReps() +
                    ", ordinal=" + this.getOrdinal() +
                    ", workoutExerciseId=" + this.getWorkoutExerciseId() +
                "}";
            }
        }
    }
}
