package net.mdh.enj.exercise;

import net.mdh.enj.mapping.SelectQueryFilters;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class SelectFilters implements SelectQueryFilters {

    private String userId;
    private String exerciseId;
    private final List<String> baseFilters;

    SelectFilters(String userId) {
        this.userId = userId;
        this.baseFilters = Arrays.asList(
            "(exerciseUserId IS NULL OR exerciseUserId = :userId)",
            "(exerciseVariantUserId IS NULL OR exerciseVariantUserId = :userId)"
        );
    }
    SelectFilters(String userId, boolean onlyMine) {
        this.userId = userId;
        this.baseFilters = Arrays.asList(
            "exerciseUserId = :userId OR (" +
                "exerciseUserId IS NULL AND exerciseVariantUserId = :userId" +
            ")"
        );
    }

    public String getUserId() {
        return this.userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getExerciseId() {
        return this.exerciseId;
    }
    public void setExerciseId(String exerciseId) {
        this.exerciseId = exerciseId;
    }

    @Override
    public boolean hasRules() {
        return true;
    }

    @Override
    public String toSql() {
        ArrayList<String> out = new ArrayList<>(baseFilters);
        if (this.exerciseId != null) {
            out.add("exerciseId = :exerciseId");
        }
        return String.join(" AND ", out);
    }
}
