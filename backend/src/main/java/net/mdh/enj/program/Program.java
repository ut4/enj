package net.mdh.enj.program;

import net.mdh.enj.mapping.DbEntity;
import net.mdh.enj.validation.UUID;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

public class Program extends DbEntity {
    @NotNull
    @Size(min = 2, max = 64)
    private String name;
    @NotNull
    @Min(1)
    private Long start;
    @NotNull
    @Min(1)
    private Long end;
    private String description;
    private List<Workout> workouts;
    private String userId;

    public String getName() {
        return this.name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getUserId() {
        return this.userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Long getStart() {
        return this.start;
    }
    public void setStart(Long start) {
        this.start = start;
    }

    public Long getEnd() {
        return this.end;
    }
    public void setEnd(Long end) {
        this.end = end;
    }

    public String getDescription() {
        return this.description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public List<Workout> getWorkouts() {
        return this.workouts;
    }
    public void setWorkouts(List<Workout> workouts) {
        this.workouts = workouts;
    }

    @Override
    public String toUpdateFields() {
        return "`name` = :name, `start` = :start, `end` = :end, description = :description";
    }

    @Override
    public boolean equals(Object obj) {
        return obj != null && obj instanceof Program && obj.toString().equals(this.toString());
    }

    @Override
    public String toString() {
        return "Program{" +
            "id=" + this.getId() +
            ", name=" + this.getName() +
            ", start=" + this.getStart() +
            ", end=" + this.getEnd() +
            ", description=" + this.getDescription() +
            ", workouts=" + this.getWorkouts() +
            ", userId=" + this.getUserId() +
        "}";
    }

    /**
     * Ohjelmatreeni-entiteetti.
     */
    public static class Workout extends DbEntity {
        private String name;
        private List<Occurence> occurrences;
        private int ordinal;
        @UUID
        private String programId;

        public String getName() {
            return this.name;
        }
        public void setName(String name) {
            this.name = name;
        }

        public List<Occurence> getOccurrences() {
            return this.occurrences;
        }
        public void setOccurrences(List<Occurence> occurrences) {
            this.occurrences = occurrences;
        }

        public int getOrdinal() {
            return this.ordinal;
        }
        public void setOrdinal(int ordinal) {
            this.ordinal = ordinal;
        }

        public String getProgramId() {
            return this.programId;
        }
        public void setProgramId(String programId) {
            this.programId = programId;
        }

        @Override
        public String toUpdateFields() {
            throw new RuntimeException("Not implemented yet.");
        }

        @Override
        public String toString() {
            return "Program.Workout{" +
                "id=" + this.getId() +
                ", name=" + this.getName() +
                ", occurrences=" + this.getOccurrences() +
                ", ordinal=" + this.getOrdinal() +
                ", programId=" + this.getProgramId() +
            "}";
        }

        public static class Occurence {
            private int weekDay;
            private Integer repeatEvery;
            public Occurence() {}
            public Occurence(int weekDay, Integer repeatEvery) {
                this.weekDay = weekDay;
                this.repeatEvery = repeatEvery;
            }

            public int getWeekDay() {
                return this.weekDay;
            }
            public void setWeekDay(int weekDay) {
                this.weekDay = weekDay;
            }

            public Integer getRepeatEvery() {
                return this.repeatEvery;
            }
            public void setRepeatEvery(Integer repeatEvery) {
                this.repeatEvery = repeatEvery;
            }
            @Override
            public String toString() {
                return this.weekDay + "," + this.repeatEvery;
            }
        }
    }
}
