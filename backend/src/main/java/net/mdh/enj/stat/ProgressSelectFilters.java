package net.mdh.enj.stat;

import net.mdh.enj.mapping.SelectQueryFilters;
import net.mdh.enj.validation.UUID;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.QueryParam;
import java.util.ArrayList;

/**
 * Bean GET /stat/progress-reitin url-parametreille.
 */
public class ProgressSelectFilters implements SelectQueryFilters {

    private String userId;
    @UUID
    @QueryParam("exerciseId")
    private String exerciseId;
    @QueryParam("formula")
    @DefaultValue(StatRepository.FORMULA_OCONNOR)
    private String formula;
    @QueryParam("before")
    private Long before;
    @QueryParam("after")
    private Long after;

    public String getExerciseId() {
        return this.exerciseId;
    }
    public void setExerciseId(String exerciseId) {
        this.exerciseId = exerciseId;
    }

    public Long getBefore() {
        return this.before;
    }
    public void setBefore(Long before) {
        this.before = before;
    }

    public Long getAfter() {
        return this.after;
    }
    public void setAfter(Long after) {
        this.after = after;
    }

    public String getUserId() {
        return this.userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getFormula() {
        return this.formula;
    }
    public void setFormula(String formula) {
        this.formula = formula;
    }

    @Override
    public boolean hasRules() {
        return true;
    }
    @Override
    public String toSql() {
        ArrayList<String> out = new ArrayList<>();
        out.add("userId = :userId");
        if (this.exerciseId != null) {
            out.add("exerciseId = :exerciseId");
        }
        if (this.before != null) {
            out.add("liftedAt < :before");
        }
        if (this.after != null) {
            out.add("liftedAt > :after");
        }
        return String.join(" AND ", out);
    }

}
