package net.mdh.enj.exercise;

import net.mdh.enj.mapping.DbEntity;
import net.mdh.enj.validation.UUID;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

public class Exercise extends DbEntity {
    @Size(min = 2, max = 64)
    private String name;
    private String userId;
    private List<Variant> variants = new ArrayList<>();

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

    public List<Variant> getVariants() {
        return this.variants;
    }
    public void setVariants(List<Variant> variants) {
        this.variants = variants;
    }

    @Override
    public String toString() {
        return "Exercise{" +
            "id=" + this.getId() +
            ", name=" + this.getName() +
            ", userId=" + this.getUserId() +
            ", variants=" + this.getVariants() +
        "}";
    }

    public static class Variant extends DbEntity {
        @Size(min = 2, max = 64)
        private String content;
        @UUID
        private String exerciseId;
        private String userId;

        public String getContent() {
            return this.content;
        }
        public void setContent(String content) {
            this.content = content;
        }

        public String getExerciseId() {
            return this.exerciseId;
        }
        public void setExerciseId(String exerciseId) {
            this.exerciseId = exerciseId;
        }

        public String getUserId() {
            return this.userId;
        }
        public void setUserId(String userId) {
            this.userId = userId;
        }

        @Override
        public String toString() {
            return "Exercise.Variant{" +
                "id=" + this.getId() +
                ", content=" + this.getContent() +
                ", userId=" + this.getUserId() +
                ", exerciseId=" + this.getExerciseId() +
            "}";
        }
    }
}
