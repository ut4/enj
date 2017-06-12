package net.mdh.enj.exercise;

import net.mdh.enj.mapping.DbEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Exercise extends DbEntity {
    protected int id;
    private String name;
    private List<Variant> variants = new ArrayList<>();

    public String getName() {
        return this.name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public List<Variant> getVariants() {
        return this.variants;
    }
    public void setVariants(List<Variant> variants) {
        this.variants = variants;
    }

    @Override
    public String toString() {
        return "{" +
            "id=" + this.getId() +
            ", name=" + this.getName() +
            ", variants=[" + this.stringifyVariants() +
        "]}";
    }

    private String stringifyVariants() {
        return !this.getVariants().isEmpty()
            ? this.getVariants().stream().map(Variant::toString).collect(Collectors.joining(", "))
            : null;
    }

    public static class Variant extends DbEntity {
        protected int id;
        private String content;
        private int exerciseId;

        public String getContent() {
            return this.content;
        }
        public void setContent(String content) {
            this.content = content;
        }

        public int getExerciseId() {
            return this.exerciseId;
        }
        public void setExerciseId(int exerciseId) {
            this.exerciseId = exerciseId;
        }

        @Override
        public String toString() {
            return "{" +
                "id=" + this.getId() +
                ", content=" + this.getContent() +
                ", exerciseId=" + this.getExerciseId() +
            "}";
        }
    }
}
