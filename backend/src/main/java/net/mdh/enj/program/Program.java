package net.mdh.enj.program;

import net.mdh.enj.validation.UUID;
import net.mdh.enj.mapping.DbEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.validation.constraints.Min;
import javax.validation.constraints.Max;
import javax.validation.Valid;
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
    @NotNull
    @Valid
    @Size(min = 1)
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
    @JsonIgnoreProperties({"occurrencesAsString"})
    public static class Workout extends DbEntity {
        @NotNull
        @Size(min = 2, max = 64)
        private String name;
        @NotNull
        @Valid
        private List<Occurrence> occurrences;
        private int ordinal;
        @UUID(allowNull = true)
        private String programId;
        private Filters filters;

        public String getName() {
            return this.name;
        }
        public void setName(String name) {
            this.name = name;
        }

        public List<Occurrence> getOccurrences() {
            return this.occurrences;
        }
        public String getOccurrencesAsString() {
            return this.occurrences.toString();
        }
        public void setOccurrences(List<Occurrence> occurrences) {
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
            return "name = :name, occurrences = :occurrencesAsString, ordinal = :ordinal";
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

        public Filters getFilters() {
            return this.filters;
        }
        public void setFilters(Filters filters) {
            this.filters = filters;
        }

        public static class Occurrence {
            @Min(0)
            @Max(6)
            private int weekDay;
            @Min(0)
            private int firstWeek;
            private Integer repeatEvery;
            public Occurrence() {}
            public Occurrence(int weekDay, int firstWeek, Integer repeatEvery) {
                this.weekDay = weekDay;
                this.firstWeek = firstWeek;
                this.repeatEvery = repeatEvery;
            }

            public int getWeekDay() {
                return this.weekDay;
            }
            public void setWeekDay(int weekDay) {
                this.weekDay = weekDay;
            }

            public int getFirstWeek() {
                return this.firstWeek;
            }
            public void setFirstWeek(int firstWeek) {
                this.firstWeek = firstWeek;
            }

            public Integer getRepeatEvery() {
                return this.repeatEvery;
            }
            public void setRepeatEvery(Integer repeatEvery) {
                this.repeatEvery = repeatEvery;
            }
            @Override
            public String toString() {
                return this.weekDay + "," + this.firstWeek + "," + this.repeatEvery;
            }
        }

        static class Filters {

            private String userId;

            Filters() {}
            Filters(String userId) {
                this.userId = userId;
            }

            public String getUserId() {
                return this.userId;
            }
            public void setUserId(String userId) {
                this.userId = userId;
            }
        }
    }
}
